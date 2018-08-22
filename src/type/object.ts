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
