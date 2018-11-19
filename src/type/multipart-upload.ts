import { OperateObjectParams, OperateOptionalBucketParams } from './object'
import { ListOperationResponse } from './request'

export interface InitMultipartUploadParams extends OperateObjectParams {}

export interface MultipartUploadParams extends OperateObjectParams {
  uploadId: string
}

export interface AbortMultipartUploadParams extends MultipartUploadParams {}

export interface UploadMultipartParams extends MultipartUploadParams {
  partNumber: number
  body: Buffer
}

export interface ListPartsOptions extends MultipartUploadParams {
  limit?: number
  marker?: number
}

export interface ListPartsResult extends ListOperationResponse<Part, number> {
  bucket: string
  owner: {
    id: string
    displayName: string
  }
  storageClass: string
}

export interface CompleteMultipartParams extends MultipartUploadParams {
  parts: Array<Pick<Part, 'partNumber' | 'eTag'>>
}

export interface ListMultipartParams extends OperateOptionalBucketParams {
  limit?: number
  marker?: string
  prefix?: string
}

export interface ListMultipartResult extends ListOperationResponse<MultipartUpload> {
  bucket: string
}

export interface Part {
  partNumber: number
  lastModified: Date
  eTag: string
  size: number
}

export interface MultipartUpload {
  key: string
  uploadId: string
  storageClass: string
  initiated: Date
}

export interface MultipartUploadObject {
  eTag: string
  bucket: string
  key: string
  location: string
}

export interface Progress {
  lengthComputable: boolean
  uploaded: number
  total: number
}

export interface PutBigObjectBaseParams extends OperateObjectParams {
  maxPart?: number
  /**
   * 当有块上传完成的时候，会调用 onProgress 回调，并传入进度信息，可以依据这个信息做一些定制化的操作。
   * 虽然回调不是很优雅，但也不失为一种办法
   * @param progress 进度信息。
   */
  onProgress?: (progress: Progress) => void
  /**
   * 并行上传的数量，默认是不限制的，也就是 Infinity，
   */
  parallel?: number
}

export interface PutBigObjectFileParams {
  /**
   * 文件名
   */
  file: string
}

export interface PutBigObjectStreamParams {
  /**
   * 需要上传的大文件。只支持读取流，不支持 Buffer。
   * 原因是因为一个大文件的 Buffer 会占用大量内存，这是不可接受的。
   */
  body: NodeJS.ReadableStream
}

export type PutBigObjectParams = (PutBigObjectFileParams | PutBigObjectStreamParams) & PutBigObjectBaseParams
