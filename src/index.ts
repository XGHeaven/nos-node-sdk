import { NosBaseClient } from './client'
import { NosClientBucketExt } from './exts/bucket'
import { NosClientMultipartUploadExt } from './exts/multipart-upload'
import { NosClientObjectExt } from './exts/object'
import { applyMixins } from './lib/util'

export * from './client'
export { ListObjectParams } from './type/list-object'

export class NosClient extends NosBaseClient {}

export interface NosClient extends NosClientBucketExt, NosClientObjectExt, NosClientMultipartUploadExt {}

applyMixins(NosClient, [NosClientBucketExt, NosClientObjectExt, NosClientMultipartUploadExt])
