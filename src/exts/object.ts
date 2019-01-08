import { parse } from 'date-fns'
import * as xml from 'fast-xml-parser'
import fs from 'fs'
import * as querystring from 'querystring'
import { pick } from 'ramda'
import * as url from 'url'
import { NosBaseClient } from '../client'
import { NosError } from '../lib/error'
import { mergeResource } from '../lib/resource'
import {
  addMetadataPrefix,
  Callbackable,
  CamelCaseObject,
  compactObject,
  getMetadataFromHeaders,
  isHttpStatusOk,
  normalizeArray,
  stream2Buffer,
} from '../lib/util'
import { Callback } from '../type/callback'
import {
  CopyObjectParams,
  DeleteMultiObjectErrorInfo,
  DeleteMultiObjectParams,
  DeleteObjectParams,
  GetObjectBufferParams,
  GetObjectParams,
  GetObjectStreamParams,
  GetObjectStringParams,
  GetObjectUrlParams,
  HeadObjectParams,
  HeadObjectResult,
  ListObjectParams,
  ListObjectResult,
  MoveObjectParams,
  OperateObjectParams,
  PutObjectParams,
  PutObjectResult,
} from '../type/object'

export class NosClientObjectExt extends NosBaseClient {
  /**
   * 获取对象列表
   */
  listObject(params?: ListObjectParams): Promise<ListObjectResult>
  listObject(params: ListObjectParams, cb: Callback<ListObjectResult>): void
  @Callbackable
  async listObject(params: ListObjectParams = {}): Promise<ListObjectResult> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(
      resource,
      pick(['prefix', 'marker', 'delimiter'], params),
      compactObject({
        // 不要问我为什么，文档就是用了 kabab case 我有什么办法
        'max-keys': params.limit,
      })
    )

    const { listBucketResult: result } = await this.requestBody('get', headers, resource)
    const objects = normalizeArray(result.contents)

    for (const obj of objects) {
      obj.lastModified = parse(obj.lastModified)
    }

    return {
      ...(pick(['isTruncated', 'nextMarker', 'prefix'], result) as any),
      bucket: result.name,
      commonPrefixes: normalizeArray(result.commonPrefixes),
      items: objects,
      delimiter: params.delimiter || '',
      limit: result.maxKeys,
    }
  }

  /**
   * 上传对象
   */
  putObject(params: PutObjectParams): Promise<PutObjectResult>
  putObject(params: PutObjectParams, cb: Callback<PutObjectResult>): void
  @Callbackable
  async putObject(params: PutObjectParams): Promise<PutObjectResult> {
    const { headers, resource } = this.validateParams(params)
    let data: Buffer | NodeJS.ReadableStream | string
    if ('file' in params) {
      data = fs.createReadStream(params.file)
    } else {
      data = params.body
    }

    Object.assign(headers, {
      ...addMetadataPrefix(params.metadata || {}),
    })

    // TODO: check eTag
    const resp = await this.request('put', headers, resource, data)

    return {
      eTag: resp.headers.get('etag') || '',
    }
  }

  /**
   * 获取对象内容。支持以 Buffer/string/Stream 的形式返回，建议使用 Stream 形式。
   * 如果你能确保返回的文件大小在合理的范围，不会导致占用过多的内容，比如说一张图片，一个文本文件等，
   * 可以直接使用 Buffer 或者 string，否则请使用 Stream
   */
  getObject(params: GetObjectStreamParams): Promise<NodeJS.ReadableStream>
  getObject(params: GetObjectBufferParams): Promise<Buffer>
  getObject(params: GetObjectStringParams): Promise<string>
  getObject(params: GetObjectStreamParams, cb: Callback<NodeJS.ReadableStream>): void
  getObject(params: GetObjectBufferParams, cb: Callback<Buffer>): void
  getObject(params: GetObjectStringParams, cb: Callback<string>): void
  @Callbackable
  async getObject(params: GetObjectParams): Promise<Buffer | string | NodeJS.ReadableStream> {
    const encode = params.encode || 'stream'
    const { bucket, headers, resource } = this.validateParams(params)

    if (params.range) {
      headers.range =
        'bytes=' +
        (typeof params.range === 'string' ? params.range : `${params.range.first || ''}-${params.range.last || ''}`)
    }

    mergeResource(resource, pick(['ifNotFound'], params))

    const resp = await this._request('get', headers, resource)
    if (!isHttpStatusOk(resp.status) && (params.ifNotFound && resp.status !== 404)) {
      await this.handleRequestError(resp)
    }

    if (encode === 'stream') {
      return resp.body
    } else if (encode === 'buffer') {
      return await stream2Buffer(resp.body)
    } else {
      return (await stream2Buffer(resp.body)).toString(encode)
    }
  }

  /**
   * 获取对象元信息。类似于 HTTP head 操作。
   */
  headObject(params: HeadObjectParams): Promise<HeadObjectResult>
  headObject(params: HeadObjectParams, cb: Callback<HeadObjectResult>): void
  @Callbackable
  async headObject(params: HeadObjectParams): Promise<HeadObjectResult> {
    const { bucket, headers, resource } = this.validateParams(params)

    if (params.ifModifiedSince) {
      headers['if-modified-since'] =
        typeof params.ifModifiedSince === 'string' ? params.ifModifiedSince : params.ifModifiedSince.toUTCString()
    }

    const resp = await this.request('head', headers, resource)

    const lastModifiedHeader = resp.headers.get('last-modified') || ''
    return {
      // lastModified maybe emitted from response
      lastModified: parse(lastModifiedHeader),
      eTag: resp.headers.get('etag') || '',
      contentType: resp.headers.get('content-type') || '',
      metadata: getMetadataFromHeaders(resp.headers),
    }
  }

  /**
   * 检查文件是否存在
   */
  isObjectExist(params: OperateObjectParams): Promise<boolean>
  isObjectExist(params: OperateObjectParams, cb: Callback<boolean>): void
  @Callbackable
  async isObjectExist(params: OperateObjectParams): Promise<boolean> {
    try {
      await this.headObject(params)
      return true
    } catch (e) {
      if (e instanceof NosError && e.status === 404) {
        return false
      }
      throw e
    }
  }

  /**
   * 复制对象
   */
  copyObject(params: CopyObjectParams): Promise<void>
  copyObject(params: CopyObjectParams, cb: Callback<void>): void
  @Callbackable
  async copyObject(params: CopyObjectParams): Promise<void> {
    const { resource, headers, sourceBucket } = this.validateBinaryParams(params)
    headers['x-nos-copy-source'] = querystring.escape(`/${sourceBucket}/${params.sourceObjectKey}`)
    await this.requestBody('put', headers, resource)
  }

  /**
   * 获取对象的可访问 Url
   */
  getObjectUrl(params: GetObjectUrlParams): Promise<string>
  getObjectUrl(params: GetObjectUrlParams, cb: Callback<string>): void
  @Callbackable
  async getObjectUrl(params: GetObjectUrlParams): Promise<string> {
    const { bucket, headers, resource } = this.validateParams(params)
    Object.assign(resource, {
      expires: params.expires,
      link: true,
    })

    const result = await this.requestBody('get', headers, resource)

    return url.format({
      protocol: this.options.protocol,
      host: `${bucket}.${this.options.host}`,
      pathname: `/${params.objectKey}`,
      search: '?' + result.linkParameter.replace(/&amp;/g, '&'),
    })
  }

  /**
   * 删除对象
   */
  deleteObject(params: DeleteObjectParams): Promise<void>
  deleteObject(params: DeleteObjectParams, cb: Callback<void>): void
  @Callbackable
  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const { headers, resource } = this.validateParams(params)

    try {
      await this.requestBody('delete', headers, resource)
    } catch (e) {
      if (e instanceof NosError && e.name === 'NoSuchKey') {
        return
      }
      throw e
    }
  }

  /**
   * 移动对象
   */
  moveObject(params: MoveObjectParams): Promise<void>
  moveObject(params: MoveObjectParams, cb: Callback<void>): void
  @Callbackable
  async moveObject(params: MoveObjectParams): Promise<void> {
    const { sourceBucket, targetBucket, headers, resource } = this.validateBinaryParams(params)
    if (sourceBucket !== targetBucket) {
      throw new Error(
        'sourceBucket must be equal to targetBucket: https://www.163yun.com/help/documents/45669971175591936'
      )
    }
    headers['x-nos-move-source'] = querystring.escape(`/${sourceBucket}/${params.sourceObjectKey}`)
    await this.request('put', headers, resource)
  }

  /**
   * 批量删除对象。
   * @return errors 删除失败的错误列表
   */
  deleteMultiObject(params: DeleteMultiObjectParams): Promise<DeleteMultiObjectErrorInfo[]>
  deleteMultiObject(params: DeleteMultiObjectParams, cb: Callback<DeleteMultiObjectErrorInfo[]>): void
  @Callbackable
  async deleteMultiObject(params: DeleteMultiObjectParams): Promise<DeleteMultiObjectErrorInfo[]> {
    const { headers, resource } = this.validateParams(params)

    if (!params.objectKeys.length) {
      // 如果没有要删除的元素，那么直接返回空信息
      return []
    }

    // TODO: check chinese objectKey
    const objects = params.objectKeys.map(key => ({ key }))

    const reqData = {
      delete: {
        quiet: true,
        object: objects,
      },
    }

    Object.assign(resource, { delete: true })

    const reqString = new xml.j2xParser({}).parse(CamelCaseObject(reqData))

    const result = await this.requestBody('post', headers, resource, reqString)
    return normalizeArray(result.deleteResult.error)
  }
}
