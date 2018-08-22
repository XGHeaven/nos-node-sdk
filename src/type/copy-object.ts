import { OperateBinaryObjectParams, OperateObjectParams } from './object'

export interface CopyObjectOptions extends OperateBinaryObjectParams {
  sourceObjectKey: string
  sourceBucket?: string
  targetObjectKey: string
  targetBucket?: string
}
