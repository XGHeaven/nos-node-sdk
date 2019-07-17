import { Response } from 'node-fetch'

export function makeNosError(errObj: any = {}) {
  const e = new NosError(errObj.message || 'Unknown error')
  e.name = errObj.code || 'NosError'
  e.resource = errObj.resource
  e.requestId = errObj.requestId
  e.status = errObj.status
  e.response = errObj.response

  return e
}

export class NosError extends Error {
  requestId!: string
  resource!: string
  status!: number
  response!: Response
}

export class NoBucketError extends Error {
  constructor() {
    super(`No bucket, Please set defaultBucket in constructor or bucket/sourceBucket/targetBucket in function params`)
  }
}

export class EtagVaildError extends Error {
  constructor() {
    super(`Upload file md5 value check does not match`)
  }
}