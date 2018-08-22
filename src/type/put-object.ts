import { OperateObjectParams } from './object'

export type PutObjectParams = PutObjectBodyOptions | PutObjectFileOptions | PutObjectStreamOptions

export interface PutObjectBaseOptions extends OperateObjectParams {
  metadata?: object
}

export interface PutObjectBodyOptions extends PutObjectBaseOptions{
  body: string | Buffer
}

export interface PutObjectStreamOptions extends PutObjectBaseOptions{
  body: NodeJS.ReadableStream,
  length?: number
}

export interface PutObjectFileOptions extends PutObjectBaseOptions {
  file: string
}

export interface PutObjectResult {
  eTag: string
}
