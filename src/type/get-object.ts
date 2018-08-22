import { OperateObjectParams } from './object'

export type GetObjectParams = GetObjectStreamParams | GetObjectBufferParams | GetObjectStringParams

export interface GetObjectBaseOptions extends OperateObjectParams {
  range?: {
    first: number,
    last?: number,
  } | {
    first?: number,
    last: number,
  } | string

  // not use?
  ifNotFound?: string

  ifModifiedSince?: Date | string
}

export interface GetObjectStreamParams extends GetObjectBaseOptions {
  encode?: 'stream'
}

export interface GetObjectBufferParams extends GetObjectBaseOptions {
  encode: 'buffer'
}

export interface GetObjectStringParams extends GetObjectBaseOptions {
  encode: string
}
