import { BucketAcl, BucketLocation } from './bucket'

export interface PutBucketParams {
  bucket: string
  acl?: BucketAcl
  location?: BucketLocation
}
