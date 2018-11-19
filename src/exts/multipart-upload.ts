import { parse } from 'date-fns'
import * as fs from 'fs'
import { type, pick } from 'ramda'
import * as util from 'util'
import { NosBaseClient } from '../client'
import { MAX_PART_LENGTH } from '../lib/constant'
import { Callbackable, compactObject, normalizeArray } from '../lib/util'
import { Callback } from '../type/callback'
import {
  AbortMultipartUploadParams,
  CompleteMultipartParams,
  InitMultipartUploadParams,
  ListMultipartParams,
  ListMultipartResult,
  ListPartsOptions,
  ListPartsResult,
  MultipartUpload,
  MultipartUploadObject,
  Part,
  PutBigObjectParams,
  UploadMultipartParams,
} from '../type/multipart-upload'

export class NosClientMultipartUploadExt extends NosBaseClient {
  /**
   * @param params
   * @return uploadId
   */
  initMultipartUpload(params: InitMultipartUploadParams): Promise<string>
  initMultipartUpload(params: InitMultipartUploadParams, cb: Callback<string>): void
  @Callbackable
  async initMultipartUpload(params: InitMultipartUploadParams): Promise<string> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(resource, {
      uploads: true,
    })

    const result = await this.requestBody('post', headers, resource)

    return result.initiateMultipartUploadResult.uploadId
  }

  abortMultipartUpload(params: AbortMultipartUploadParams): Promise<boolean>
  abortMultipartUpload(params: AbortMultipartUploadParams, cb: Callback<boolean>): void
  @Callbackable
  async abortMultipartUpload(params: AbortMultipartUploadParams): Promise<boolean> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(resource, {
      uploadId: params.uploadId,
    })

    const result = await this.requestBody('delete', headers, resource)

    return true
  }

  uploadMultipart(params: UploadMultipartParams): Promise<Part>
  uploadMultipart(params: UploadMultipartParams, cb: Callback<Part>): void
  @Callbackable
  async uploadMultipart(params: UploadMultipartParams): Promise<Part> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(resource, {
      partNumber: params.partNumber,
      uploadId: params.uploadId,
    })

    const resp = await this.request('put', headers, resource, params.body)

    return {
      partNumber: params.partNumber,
      eTag: (resp.headers.get('etag') as string).slice(1, -1),
      size: params.body.length,
      lastModified: parse(resp.headers.get('date') as string),
    }
  }

  /**
   * list parts of object
   * @param params
   */
  listParts(params: ListPartsOptions): Promise<ListPartsResult>
  listParts(params: ListPartsOptions, cb: Callback<ListPartsResult>): void
  @Callbackable
  async listParts(params: ListPartsOptions): Promise<ListPartsResult> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(
      resource,
      compactObject({
        uploadId: params.uploadId,
        'max-parts': params.limit,
        'part-number-marker': params.marker,
      })
    )

    const { listPartsResult: result } = await this.requestBody('get', headers, resource)

    let parts = result.part

    if (type(parts) !== 'Array') {
      parts = [parts]
    }

    for (const part of parts) {
      part.lastModified = parse(part.lastModified)
    }

    return {
      ...(pick(['isTruncated', 'owner', 'storageClass', 'bucket'], result) as any),
      limit: result.maxParts,
      nextMarker: result.nextPartNumberMarker,
      items: parts,
    }
  }

  listMultipartUpload(params?: ListMultipartParams): Promise<ListMultipartResult>
  listMultipartUpload(params: ListMultipartParams, cb: Callback<ListMultipartResult>): void
  @Callbackable
  async listMultipartUpload(params: ListMultipartParams = {}): Promise<ListMultipartResult> {
    const { bucket, headers, resource } = this.validateParams(params)
    Object.assign(
      resource,
      compactObject({
        uploads: true,
        prefix: params.prefix,
        'key-marker': params.marker,
        'max-uploads': params.limit,
      })
    )

    if (params.limit) {
      headers['max-uploads'] = params.limit
    }

    const { listMultipartUploadsResult: result } = await this.requestBody('get', headers, resource)

    let uploads = normalizeArray(result.upload)

    if (type(uploads) !== 'Array') {
      uploads = [uploads]
    }

    for (const upload of uploads) {
      upload.initiated = parse(upload.initiated)
    }

    return {
      ...(pick(['isTruncated'], result) as any),
      items: uploads,
      nextMarker: result.nextKeyMarker,
      bucket: result.bucket,
      limit: params.limit || 1000,
    }
  }

  completeMultipartUpload(params: CompleteMultipartParams): Promise<MultipartUploadObject>
  completeMultipartUpload(params: CompleteMultipartParams, cb: Callback<MultipartUploadObject>): void
  @Callbackable
  async completeMultipartUpload(params: CompleteMultipartParams): Promise<MultipartUploadObject> {
    const { bucket, headers, resource } = this.validateParams(params)

    Object.assign(resource, {
      uploadId: params.uploadId,
    })

    const result = await this.requestBody('post', headers, resource, {
      completeMultipartUpload: {
        part: params.parts.map(part => ({ partNumber: part.partNumber, eTag: part.eTag })),
      },
    })

    return result.completeMultipartUploadResult
  }

  putBigObject(params: PutBigObjectParams): Promise<MultipartUploadObject>
  putBigObject(params: PutBigObjectParams, cb: Callback<MultipartUploadObject>): void
  @Callbackable
  async putBigObject(params: PutBigObjectParams): Promise<MultipartUploadObject> {
    const uploadId = await this.initMultipartUpload(params)
    const stream: NodeJS.ReadableStream = 'body' in params ? params.body : fs.createReadStream(params.file)
    const lengthComputable = 'file' in params
    const { parallel = Infinity, maxPart = MAX_PART_LENGTH } = params

    let totalLength = 0

    if ('file' in params) {
      const stat = await util.promisify(fs.stat)(params.file)
      totalLength = stat.size
    }

    const rootParams = {
      uploadId,
      objectKey: params.objectKey,
      bucket: params.bucket,
    }
    const bufs: Buffer[] = []
    const partPromises: Promise<Part>[] = []
    let length: number = 0
    let partNumber: number = 1
    let aborted: boolean = false
    let uploadedLength: number = 0
    let onProgress = params.onProgress
    let workers = 0

    const uploadPart = async (): Promise<Part> => {
      const tBuf = Buffer.concat(bufs)
      const tPartNumber = partNumber++
      bufs.length = 0
      length = 0

      if (++workers >= parallel) {
        stream.pause()
      }

      const part = await this.uploadMultipart({
        ...rootParams,
        partNumber: tPartNumber,
        body: tBuf,
      })

      workers--

      if (stream.isPaused()) {
        stream.resume()
      }

      uploadedLength += tBuf.length

      if (onProgress) {
        onProgress({
          lengthComputable,
          uploaded: uploadedLength,
          total: totalLength,
        })
      }

      return part
    }

    return await new Promise<MultipartUploadObject>((resolve, reject) => {
      const completeUpload = async () => {
        const parts = await Promise.all(partPromises)

        const resp = await this.completeMultipartUpload({
          ...rootParams,
          parts,
        })

        resolve(resp)
      }

      const abortUpload = (e: Error) => {
        if (aborted) {
          return
        }
        stream.off('data', onData)
        aborted = true
        reject(e)
      }

      const onData = (data: Buffer) => {
        if (data.length + length > maxPart) {
          const partPromise = uploadPart()
          partPromise.catch(abortUpload)
          partPromises.push(partPromise)
        }
        bufs.push(data)
        length += data.length
      }

      stream.on('data', onData)

      stream.once('end', () => {
        if (length) {
          const partPromise = uploadPart()
          partPromise.catch(abortUpload)
          partPromises.push(partPromise)
        }
        completeUpload().catch(abortUpload)
      })

      stream.once('error', abortUpload)
    })
  }
}
