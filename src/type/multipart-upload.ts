import { OperateObjectParams, OperateOptionalBucketParams } from './object'

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
}

export interface CompleteMultipartParams extends MultipartUploadParams {
  parts: Part[]
}

export interface ListMultipartParams extends OperateOptionalBucketParams {
  limit?: number
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
