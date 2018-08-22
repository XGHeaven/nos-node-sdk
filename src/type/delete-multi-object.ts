import { OperateOptionalBucketParams, OperateObjectParams } from './object'

export interface DeleteMultiObjectParams extends OperateOptionalBucketParams {
  objectKeys: string[]
}

export interface DeleteMultiObjectErrorInfo {
  key: string
  code: string
  error: string
}
