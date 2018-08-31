import { NosClient } from '../../src'
import { cleanClient, newClient, randomObjectKey } from '../helpers/client'
import { newReadableStream, newTempFile } from '../helpers/runtime'

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
  const uploadId = await client.initMultipartUpload({ objectKey: key })

  expect(uploadId).toBeTruthy()

  await client.abortMultipartUpload({ objectKey: key, uploadId })
})

it('upload multipart', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({ objectKey: key })

  const res = await client.uploadMultipart({ objectKey: key, uploadId, partNumber: 1, body: Buffer.alloc(16 * 1024) })
  expect(res).toBeTruthy()

  await client.abortMultipartUpload({ objectKey: key, uploadId })
})

it('list parts', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({ objectKey: key })

  await client.uploadMultipart({ objectKey: key, uploadId, partNumber: 1, body: Buffer.alloc(16 * 1024) })

  const list = await client.listParts({ objectKey: key, uploadId: uploadId })

  expect(list).toHaveLength(1)

  await client.abortMultipartUpload({ objectKey: key, uploadId })
})

it('complete upload multipart', async () => {
  const key = randomObjectKey()
  const uploadId = await client.initMultipartUpload({ objectKey: key })

  const body = Buffer.alloc(32 * 1024)
  const parts = await Promise.all([
    client.uploadMultipart({ objectKey: key, uploadId, partNumber: 1, body }),
    client.uploadMultipart({ objectKey: key, uploadId, partNumber: 2, body }),
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

describe('putBigObject', async () => {
  it('should upload success', async () => {
    jest.setTimeout(20 * 1000)
    const body = newReadableStream(1024 * 1024) // 1M
    const key = randomObjectKey()

    const res = await client.putBigObject({
      body,
      objectKey: key,
      maxPart: 1024 * 128, // 128k
      parallel: 1
    })

    expect(res.key).toEqual(key)

    await expect(client.isObjectExist({objectKey: key})).resolves.toBeTrue()
  })
})
