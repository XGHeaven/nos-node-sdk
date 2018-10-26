import { ListOperationResponse } from './request'

export interface OperateObjectParams extends OperateOptionalBucketParams {
  objectKey: string
}

export interface OperateBinaryObjectParams {
  sourceObjectKey: string
  sourceBucket?: string
  targetObjectKey: string
  targetBucket?: string
}

export interface OperateOptionalBucketParams {
  bucket?: string
}

export interface ObjectMetadata {
  [x: string]: string
}

export interface ObjectContent {
  key: string
  lastModified: string
  eTag: string
  size: number
  storageClass: string
}

export interface CommonPrefixContent {
  prefix: string
}

export interface CopyObjectParams extends OperateBinaryObjectParams {
  sourceObjectKey: string
  sourceBucket?: string
  targetObjectKey: string
  targetBucket?: string
}

export interface DeleteObjectParams extends OperateObjectParams {}

export type GetObjectParams = GetObjectStreamParams | GetObjectBufferParams | GetObjectStringParams

export interface GetObjectBaseOptions extends OperateObjectParams {
  range?:
    | {
        first: number
        last?: number
      }
    | {
        first?: number
        last: number
      }
    | string

  // not use?
  ifNotFound?: string

  ifModifiedSince?: Date | string
}

export interface GetObjectStreamParams extends GetObjectBaseOptions {
  encode?: 'stream'
}

export interface GetObjectBufferParams extends GetObjectBaseOptions {
  encode: 'buffer'
}

export interface GetObjectStringParams extends GetObjectBaseOptions {
  encode: string
}

export interface GetObjectUrlParams extends OperateObjectParams {
  expires: number
}

export interface HeadObjectParams extends OperateObjectParams {
  // not used
  ifModifiedSince?: string | Date
}

export interface HeadObjectResult {
  contentType: string
  eTag: string
  lastModified: Date
  metadata: {
    [x: string]: string
  }
}

export interface ListObjectParams extends OperateOptionalBucketParams {
  delimiter?: string
  marker?: string
  limit?: number
  prefix?: string
}

export interface ListObjectResult extends ListOperationResponse<ObjectContent> {
  delimiter: string
  prefix: string
  bucket: string
  commonPrefixes: CommonPrefixContent[]
}

export interface MoveObjectParams extends OperateBinaryObjectParams {}

export type PutObjectParams = PutObjectBodyOptions | PutObjectFileOptions | PutObjectStreamOptions

export interface PutObjectBaseOptions extends OperateObjectParams {
  metadata?: object
}

export interface PutObjectBodyOptions extends PutObjectBaseOptions {
  body: string | Buffer
}

export interface PutObjectStreamOptions extends PutObjectBaseOptions {
  body: NodeJS.ReadableStream
  length?: number
}

export interface PutObjectFileOptions extends PutObjectBaseOptions {
  file: string
}

export interface PutObjectResult {
  eTag: string
}

export interface DeleteMultiObjectParams extends OperateOptionalBucketParams {
  objectKeys: string[]
}

export interface DeleteMultiObjectErrorInfo {
  key: string
  code: string
  error: string
}
