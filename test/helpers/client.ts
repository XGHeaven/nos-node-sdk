import { NosClient } from '../../src'
import * as dotenv from 'dotenv'
dotenv.config()

export function randomBucketName() {
  return `nos-node-sdk-test-bucket-${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
}

export function randomObjectKey(ext: string = '', prefix: string = '') {
  return `${prefix}object-name-${Date.now()}-${Math.floor(Math.random() * 900) + 100}${ext}`
}

export async function newClient() {
  const bucket = 'nos-node-sdk-test' //randomBucketName()
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
  if (bucket) {
    // await client.deleteBucket(bucket)
  }
}

export async function newBucket(client: NosClient, bucket: string = randomBucketName()): Promise<string> {
  await client.putBucket({ bucket })
  return bucket
}

export async function cleanBucket(client: NosClient, bucket: string): Promise<void> {
  const list = await client.listObject({ bucket })
  for (const obj of list) {
    await client.deleteObject({ objectKey: obj.key, bucket })
  }
}

export async function deleteBucket(client: NosClient, bucket: string): Promise<void> {
  await cleanBucket(client, bucket)
  await client.deleteBucket({ bucket })
}
