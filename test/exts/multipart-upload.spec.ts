import { NosClient } from '../../src'
import { cleanClient, newClient, randomObjectKey } from '../helpers/client'

let client: NosClient
let bucket: string

beforeAll(async () => {
  client = await newClient()
  bucket = client.options.defaultBucket as string
})

afterAll(async () => {
  await cleanClient(client)
})

it('init/abort multipart upload', async () => {
  const key = randomObjectKey('.txt')
  const uploadId = await client.initMultipartUpload({objectKey: key})

  expect(uploadId).toBeTruthy()

  await client.abortMultipartUpload({objectKey: key, uploadId})
})

it('upload multipart', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({objectKey: key})

  const res = await client.uploadMultipart({objectKey: key, uploadId, partNumber: 1, body: Buffer.alloc(16 * 1024)})
  expect(res).toBeTruthy()

  await client.abortMultipartUpload({objectKey: key, uploadId})
})

it('list parts', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({objectKey: key})

  await client.uploadMultipart({objectKey:key, uploadId, partNumber: 1, body: Buffer.alloc(16 * 1024)})

  const list = await client.listParts({objectKey: key, uploadId: uploadId})

  expect(list).toHaveLength(1)

  await client.abortMultipartUpload({objectKey: key, uploadId})
})

it('complete upload multipart', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({objectKey: key})

  const body = Buffer.alloc(32 * 1024)
  const parts = await Promise.all([
    client.uploadMultipart({objectKey: key, uploadId, partNumber: 1, body}),
    client.uploadMultipart({objectKey: key, uploadId, partNumber: 2, body}),
  ])

  const file = await client.completeMultipartUpload({
    objectKey: key,
    uploadId,
    parts: parts,
  })

  expect(file.key).toEqual(key)
})

it('list multipart', async () => {
  const list = await client.listMultipartUpload()
  expect(list).toHaveProperty('length')
})
