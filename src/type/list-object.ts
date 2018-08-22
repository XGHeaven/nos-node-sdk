import { ObjectContent, OperateOptionalBucketParams } from './object'

export interface ListObjectResult {
  // Bucket name
  name: string
  prefix: string
  marker: string
  maxKeys: number
  isTruncated: boolean
  contents: ObjectContent[]
}

export interface ListObjectParams extends OperateOptionalBucketParams {
  delimiter?: string
  marker?: string
  limit?: number
  prefix?: string
}
