import { parse } from "date-fns"
import * as xml from 'fast-xml-parser'
import { type } from 'ramda'
import { NosBaseClient } from '../client'
import { Callbackable, CamelCaseObject, normalizeArray } from '../lib/util'
import { Callback } from '../type/callback'
import { DeleteMultiObjectErrorInfo, DeleteMultiObjectParams } from '../type/delete-multi-object'
import {
  AbortMultipartUploadParams, CompleteMultipartParams,
  InitMultipartUploadParams, ListMultipartParams, ListPartsOptions, MultipartUpload, MultipartUploadObject,
  Part,
  UploadMultipartParams,
} from '../type/multipart-upload'

export class NosClientMultipartUploadExt extends NosBaseClient {
  @Callbackable
  async initMultipartUpload(params: InitMultipartUploadParams): Promise<string> {
    const {bucket, headers, resource} = this.validateParams(params)

    Object.assign(resource, {
      uploads: true,
    })

    const result = await this.requestBody('post', headers, resource)

    return result.initiateMultipartUploadResult.uploadId
  }

  @Callbackable
  async abortMultipartUpload(params: AbortMultipartUploadParams): Promise<boolean> {
    const {bucket, headers, resource} = this.validateParams(params)

    Object.assign(resource, {
      uploadId: params.uploadId,
    })

    const result = await this.requestBody('delete', headers, resource)
    console.log(result)

    return true
  }

  @Callbackable
  async uploadMultipart(params: UploadMultipartParams): Promise<Part> {
    const {bucket, headers, resource} = this.validateParams(params)

    Object.assign(resource, {
      partNumber: params.partNumber,
      uploadId: params.uploadId,
    })

    const resp = await this.request('put', headers, resource, params.body)

    console.log(resp.headers.raw())
    return {
      partNumber: params.partNumber,
      eTag: (resp.headers.get('etag') as string).slice(1, -1),
      size: params.body.length,
      lastModified: parse(resp.headers.get('date') as string)
    }
  }

  /**
   * list parts of object
   * @param remoteName
   * @param uploadId
   * @param params
   */
  @Callbackable
  async listParts(params: ListPartsOptions): Promise<Part[]> {
    const {bucket, headers, resource} = this.validateParams(params)

    Object.assign(resource, {
      uploadId: params.uploadId,
      'max-parts': params.limit || 1000
    })

    const result = await this.requestBody('get', headers, resource)

    let parts = result.listPartsResult.part

    if (type(parts) !== 'Array') {
      parts = [parts]
    }

    for (const part of parts) {
      part.lastModified = parse(part.lastModified)
    }

    return parts
  }

  @Callbackable
  async listMultipartUpload(params: ListMultipartParams = {}): Promise<MultipartUpload[]> {
    const {bucket, headers, resource} = this.validateParams(params)
    Object.assign(resource, {
      uploads: true,
    })

    if (params.limit) {
      headers['max-uploads'] = params.limit
    }

    const result = await this.requestBody('get', headers, resource)

    let uploads = normalizeArray(result.listMultipartUploadsResult.upload)

    if (type(uploads)!=='Array') {
      uploads = [uploads]
    }

    for (const upload of uploads) {
      upload.initiated = parse(upload.initiated)
    }

    return uploads
  }

  @Callbackable
  async completeMultipartUpload(params: CompleteMultipartParams): Promise<MultipartUploadObject> {
    const {bucket, headers, resource} = this.validateParams(params)

    Object.assign(resource, {
      uploadId: params.uploadId,
    })

    const result = await this.requestBody('post', headers, resource, {
      completeMultipartUpload: {
        part: params.parts.map(part => ({partNumber: part.partNumber, eTag: part.eTag}))
      }
    })

    return result.completeMultipartUploadResult
  }
}

export interface NosClientMultipartUploadExt {
  initMultipartUpload(params: InitMultipartUploadParams, cb: Callback<string>): void
  abortMultipartUpload(params: AbortMultipartUploadParams, cb: Callback<boolean>): void
  uploadMultipart(params: UploadMultipartParams, cb: Callback<Part>): void
  listParts(params: ListPartsOptions, cb: Callback<Part[]>): void
  listMultipartUpload(params: ListMultipartParams, cb: Callback<MultipartUpload[]>): void
  completeMultipartUpload(params: CompleteMultipartParams, cb: Callback<MultipartUploadObject>): void
}
