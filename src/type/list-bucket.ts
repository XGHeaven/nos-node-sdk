import { Bucket } from './bucket'
import { OperateOptionalBucketParams } from './object'

export interface ListBucketParams extends OperateOptionalBucketParams {}

export interface ListBucketResult {
  owner: {
    displayName: string
    id: string
  }
  buckets: Bucket[]
}
