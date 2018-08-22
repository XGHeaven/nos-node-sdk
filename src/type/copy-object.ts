import { OperateBinaryObjectParams, OperateObjectParams } from './object'

export interface CopyObjectParams extends OperateBinaryObjectParams {
  sourceObjectKey: string
  sourceBucket?: string
  targetObjectKey: string
  targetBucket?: string
}
