import { OperateOptionalBucketParams } from './object'
import { ListOperationResponse } from './request'

export interface Bucket {
  creationDate: Date
  name: string
}

export enum BucketAcl {
  PRIVATE = 'private',
  PUBLISH = 'public-read',
}

export enum BucketLocation {
  /**
   * 杭州
   */
  HZ = 'HZ',
  /**
   * 北京
   */
  BJ = 'BJ',
  /**
   * 广州
   */
  GZ = 'GZ',
}

export interface OperateBucketParams {
  bucket: string
}

export interface SetBucketAclParams extends OperateBucketParams {
  acl: BucketAcl
}

export interface SetBucketDefault404Params extends OperateBucketParams {
  objectKey: string
}

export interface BucketWebsite {
  indexDocument: string
  errorDocument?: string
}

export interface ListBucketParams extends OperateOptionalBucketParams {}

export interface ListBucketResult extends ListOperationResponse<Bucket> {
  owner: {
    displayName: string
    id: string
  }
}

export interface PutBucketParams {
  bucket: string
  acl?: BucketAcl
  location?: BucketLocation
}
