import { BucketAcl, BucketLocation } from './bucket'
import { OperateOptionalBucketParams } from './object'

export interface PutBucketParams {
  bucket: string
  acl?: BucketAcl
  location?: BucketLocation
}
