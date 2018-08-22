import { parse } from 'date-fns'
import * as xml from 'fast-xml-parser'
import fs from 'fs'
import * as querystring from 'querystring'
import { pick, type } from 'ramda'
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
import { CopyObjectOptions } from '../type/copy-object'
import { DeleteMultiObjectErrorInfo, DeleteMultiObjectParams } from '../type/delete-multi-object'
import { DeleteObjectParams } from '../type/delete-object'
import {
  GetObjectBufferParams,
  GetObjectParams,
  GetObjectStreamParams,
  GetObjectStringParams,
} from '../type/get-object'
import { GetObjectUrlParams } from '../type/get-object-url'
import { HeadObjectParams, HeadObjectResult } from '../type/head-object'
import { ListObjectParams } from '../type/list-object'
import { MoveObjectParams } from '../type/move-object'
import { ObjectContent, OperateObjectParams } from '../type/object'
import { PutObjectParams, PutObjectResult } from '../type/put-object'

export class NosClientObjectExt extends NosBaseClient {
  @Callbackable
  async listObject(params: ListObjectParams = {}): Promise<ObjectContent[]> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(
      resource,
      pick(['prefix', 'marker', 'delimiter'], params),
      compactObject({
        // 不要问我为什么，文档就是用了 kabab case 我有什么办法
        'max-keys': params.limit,
      })
    )

    const data = await this.requestBody('get', headers, resource)
    let objects = normalizeArray(data.listBucketResult.contents)

    for (const obj of objects) {
      obj.lastModified = parse(obj.lastModified)
    }

    return objects
  }

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

  async getObject(params: GetObjectStreamParams): Promise<NodeJS.ReadableStream>
  async getObject(params: GetObjectBufferParams): Promise<Buffer>
  async getObject(params: GetObjectStringParams): Promise<string>
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

  @Callbackable
  async copyObject(params: CopyObjectOptions): Promise<void> {
    const { resource, headers, sourceBucket } = this.validateBinaryParams(params)
    headers['x-nos-copy-source'] = querystring.escape(`/${sourceBucket}/${params.sourceObjectKey}`)
    await this.requestBody('put', headers, resource)
  }

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
   * delete multi object at once
   * @param params
   * @return return array which delete error
   */
  @Callbackable
  async deleteMultiObject(params: DeleteMultiObjectParams): Promise<DeleteMultiObjectErrorInfo[]> {
    const { headers, resource } = this.validateParams(params)

    const reqData = {
      delete: {
        quiet: true,
        object: params.objectKeys.map(key => ({ key })),
      },
    }

    Object.assign(resource, { delete: true })

    const reqString = new xml.j2xParser({}).parse(CamelCaseObject(reqData))

    const result = await this.requestBody('post', headers, resource, reqString)
    return normalizeArray(result.deleteResult.error)
  }
}

export interface NosClientObjectExt {
  listObject(params: ListObjectParams, cb: Callback<ObjectContent[]>): void
  putObject(params: PutObjectParams, cb: Callback<PutObjectResult>): void
  getObject(params: GetObjectStreamParams, cb: Callback<NodeJS.ReadableStream>): void
  getObject(params: GetObjectBufferParams, cb: Callback<Buffer>): void
  getObject(params: GetObjectStringParams, cb: Callback<string>): void
  headObject(params: HeadObjectParams, cb: Callback<HeadObjectResult>): void
  isObjectExist(params: OperateObjectParams, cb: Callback<boolean>): void
  copyObject(params: CopyObjectOptions, cb: Callback<void>): void
  getObjectUrl(params: GetObjectUrlParams, cb: Callback<string>): void
  deleteObject(params: DeleteObjectParams, cb: Callback<void>): void
  moveObject(params: MoveObjectParams, cb: Callback<void>): void
  deleteMultiObject(params: DeleteMultiObjectParams, cb: Callback<DeleteMultiObjectErrorInfo[]>): void
}