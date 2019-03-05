import fetch from 'node-fetch'
import { NosClient } from '../../src'
import * as dotenv from 'dotenv'
import 'jest-extended'
dotenv.config()

// 缓存的直传最优上传节点
let cacheEndpoint = ''

export function randomBucketName() {
  return `nos-node-sdk-test-bucket-${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
}

export function randomObjectKey(ext: string = '', prefix: string = '') {
  return `${prefix}object-name-${Date.now()}-${Math.floor(Math.random() * 900) + 100}${ext}`
}

export async function newClient() {
  const bucket = process.env.TEST_RANDOM_BUCKET ? randomBucketName() : 'nos-node-sdk-test' //randomBucketName()
  const client = new NosClient({
    accessKey: process.env.NOS_ACCESS_KEY as string,
    accessSecret: process.env.NOS_ACCESS_SECRET as string,
    endpoint: 'http://nos-eastchina1.126.net',
    defaultBucket: bucket,
  })

  await client.ensureBucket({ bucket })

  return client
}

export function newClientWithoutBucket() {
  const client = new NosClient({
    accessKey: process.env.NOS_ACCESS_KEY as string,
    accessSecret: process.env.NOS_ACCESS_SECRET as string,
    endpoint: 'http://nos-eastchina1.126.net',
  })
  return client
}

export async function cleanClient(client: NosClient) {
  const bucket = client.options.defaultBucket
  if (bucket && process.env.TEST_RANDOM_BUCKET) {
    await deleteBucket(client, bucket)
  }
}

export async function newBucket(client: NosClient, bucket: string = randomBucketName()): Promise<string> {
  await client.putBucket({ bucket })
  return bucket
}

export async function cleanBucket(client: NosClient, bucket: string): Promise<void> {
  // clean file
  let hasMore = false
  do {
    const { items, isTruncated } = await client.listObject({ bucket, limit: 1000 })
    await client.deleteMultiObject({
      objectKeys: items.map(obj => obj.key),
      bucket,
    })

    hasMore = isTruncated
  } while (hasMore)

  // clean multiparts
  hasMore = false
  do {
    const { items, isTruncated } = await client.listMultipartUpload({ bucket, limit: 1000 })
    for (const object of items) {
      await client.abortMultipartUpload({
        objectKey: object.key,
        uploadId: object.uploadId,
      })
    }
    hasMore = isTruncated
  } while (hasMore)
}

export async function deleteBucket(client: NosClient, bucket: string): Promise<void> {
  await cleanBucket(client, bucket)
  await client.deleteBucket({ bucket })
}

export async function putRandomObject(
  client: NosClient,
  times: number = 1,
  keyGen: () => string = randomObjectKey
): Promise<void> {
  // 串行添加，减轻请求的压力，懒得弄成限流并行了
  for (let i = 0; i < times; i++) {
    await client.putObject({
      objectKey: keyGen(),
      body: 'random-object-' + Date.now(),
    })
  }
}

export async function uploadUseToken(token: string, bucket: string, objectKey: string, body: Buffer | string, headers: any = {}): Promise<boolean> {
  let endpoint = cacheEndpoint
  if (!endpoint) {
    const resp = await fetch('http://lbs-eastchina1.126.net/lbs?version=1.0&bucketname=' + bucket)
    const data = await resp.json()
    endpoint = cacheEndpoint = data.upload[0]
  }

  const resp = await fetch(`${endpoint}/${bucket}/${objectKey}?offset=0&complete=true&version=1.0`, {
    method: 'POST',
    headers: {
      'host': 'nos-eastchina1.126.net',
      'x-nos-token': `UPLOAD ${token}`,
      'content-length': body.length.toString(),
      ...headers
    },
    body
  })

  const data = await resp.json()

  return !data.errCode
}
