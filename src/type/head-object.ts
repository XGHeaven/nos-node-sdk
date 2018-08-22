import { OperateObjectParams } from './object'

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
