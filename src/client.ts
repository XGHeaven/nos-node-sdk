import { j2xParser } from 'fast-xml-parser'
import mime from 'mime'
import fetch, { Response } from 'node-fetch'
import * as url from 'url'
import { signature } from './lib/authorization'
import { makeNosError, NoBucketError } from './lib/error'
import { parseBody } from './lib/request'
import { getResourceUri } from './lib/resource'
import { CamelCaseObject, encodeKey, isHttpStatusOk, md5sum } from './lib/util'
import { OperateBinaryObjectParams, OperateObjectParams, OperateOptionalBucketParams } from './type/object'
import { Resource } from './type/resource'

declare module 'node-fetch' {
  interface Response {
    data: any
  }
}

export interface NosClientOptions {
  accessKey: string
  accessSecret: string
  endpoint: string
  defaultBucket?: string
}

export class NosBaseClient {
  options: NosClientOptions & {
    host: string
    protocol: string
  }

  constructor(options: NosClientOptions) {
    const parsed = url.parse(options.endpoint)
    this.options = Object.assign(
      {
        host: parsed.host as string,
        protocol: parsed.protocol as string,
      },
      options
    )
  }

  /**
   * 底层请求方法包装
   * @param method 请求方法
   * @param headers 头信息
   * @param resource 资源信息，也会序列化到 Url 上面
   * @param [body] 请求体
   * @private
   */
  protected async _request(method: string, headers: any, resource: Resource, body?: any): Promise<Response> {
    headers['date'] = new Date().toUTCString()

    const uri = getResourceUri(resource)

    // 并不知道设置错误的 content-type 会有什么影响，但是设置了就没错
    if (body) {
      if (typeof body === 'object' && body.constructor === Object) {
        body = new j2xParser({}).parse(CamelCaseObject(body))
        headers['content-type'] = 'application/xml;charset=UTF-8'
      } else {
        headers['content-type'] = mime.getType(uri) || 'application/octet-stream'
      }
    }

    if (body instanceof Buffer || typeof body === 'string') {
      headers['content-md5'] = md5sum(body)
      headers['content-length'] = headers['content-length'] || body.length
    }

    const sign = signature(this.options.accessSecret, method, headers, resource)
    headers['authorization'] = `NOS ${this.options.accessKey}:${sign}`

    return await fetch(url.resolve(this.options.endpoint, uri), {
      method,
      headers,
      body,
    })
  }

  protected async handleRequestError(resp: Response) {
    if (!isHttpStatusOk(resp.status)) {
      const errObj = (await parseBody(resp)).error || {}
      errObj.status = resp.status
      errObj.response = resp
      throw makeNosError(errObj)
    }

    return resp
  }

  protected async request(method: string, headers: any, resource: Resource, body?: any): Promise<Response> {
    const resp = await this._request(method, headers, resource, body)
    return await this.handleRequestError(resp)
  }

  protected async requestBody(method: string, headers: any, resource: Resource, body?: any): Promise<any> {
    const resp = await this.request(method, headers, resource, body)
    return await parseBody(resp)
  }

  protected validateParams(
    params: OperateObjectParams | OperateOptionalBucketParams
  ): {
    bucket: string
    headers: any
    resource: Resource
  } {
    const bucket = params.bucket || this.options.defaultBucket
    if (!bucket) {
      throw new NoBucketError()
    }

    const resource: any = {
      bucket,
    }

    if ('objectKey' in params) {
      resource.objectKey = encodeKey(params.objectKey)
    }

    return {
      bucket,
      resource,
      headers: {
        host: `${bucket}.${this.options.host}`,
      },
    }
  }

  protected validateBinaryParams(
    params: OperateBinaryObjectParams
  ): {
    sourceBucket: string
    targetBucket: string
    resource: Resource
    headers: any
  } {
    const sourceBucket = params.sourceBucket || this.options.defaultBucket
    const targetBucket = params.targetBucket || this.options.defaultBucket

    if (!sourceBucket || !targetBucket) {
      throw new NoBucketError()
    }

    const resource: any = {
      bucket: targetBucket,
    }

    if ('targetObjectKey' in params) {
      resource.objectKey = params.targetObjectKey
    }

    return {
      sourceBucket,
      targetBucket,
      resource,
      headers: {
        host: `${targetBucket}.${this.options.host}`,
      },
    }
  }
}
