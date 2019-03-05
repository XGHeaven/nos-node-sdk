import { NosBaseClient } from './client'
import { NosClientAuthExt } from './exts/auth'
import { NosClientBucketExt } from './exts/bucket'
import { NosClientMultipartUploadExt } from './exts/multipart-upload'
import { NosClientObjectExt } from './exts/object'
import { applyMixins } from './lib/util'

export { NosClientOptions } from './client'
export * from './type/object'
export * from './type/multipart-upload'
export * from './type/bucket'
export * from './type/callback'
export * from './lib/error'
export { Token, CreateTokenParams } from './exts/auth'

export class NosClient extends NosBaseClient {}

export interface NosClient extends NosClientBucketExt, NosClientObjectExt, NosClientMultipartUploadExt, NosClientAuthExt {}

applyMixins(NosClient, [NosClientBucketExt, NosClientObjectExt, NosClientMultipartUploadExt, NosClientAuthExt])
