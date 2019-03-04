import { NosClient } from '../../src'
import { cleanClient, newClient, randomObjectKey } from '../helpers/client'
import { newReadableStream, newTempFile } from '../helpers/runtime'
import { join } from 'path'

let client: NosClient
let bucket: string

async function cleanMultipart(client: NosClient) {
  let hasMore = false
  do {} while (hasMore)
}

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

describe('listParts', () => {
  it('should return parts', async () => {
    const key = randomObjectKey()
    const uploadId = await client.initMultipartUpload({ objectKey: key })

    await client.uploadMultipart({ objectKey: key, uploadId, partNumber: 1, body: Buffer.alloc(16 * 1024) })

    const ret = await client.listParts({ objectKey: key, uploadId: uploadId })

    expect(ret.items).toHaveLength(1)
    expect(ret.bucket).toBe(bucket)
    expect(ret.isTruncated).toBeFalse()
    expect(ret.nextMarker).toBe(1)
    expect(ret.limit).toBe(1000)

    await client.abortMultipartUpload({ objectKey: key, uploadId })
  })

  it('should return parts with limit', async () => {
    const key = randomObjectKey()
    const uploadId = await client.initMultipartUpload({ objectKey: key })

    for (let i = 0; i < 5; i++) {
      await client.uploadMultipart({ objectKey: key, uploadId, partNumber: i + 1, body: Buffer.alloc(16 * 1024) })
    }

    const ret = await client.listParts({ objectKey: key, uploadId, limit: 3 })

    expect(ret.items).toHaveLength(3)
    expect(ret.nextMarker).not.toBeEmpty()
    expect(ret.isTruncated).toBeTrue()
    expect(ret.limit).toBe(3)

    await client.abortMultipartUpload({ objectKey: key, uploadId })
  })

  it('should return parts with marker', async () => {
    const objectKey = randomObjectKey()
    const uploadId = await client.initMultipartUpload({ objectKey })

    for (let i = 0; i < 5; i++) {
      await client.uploadMultipart({
        objectKey,
        uploadId,
        partNumber: i + 1,
        body: Buffer.alloc(16 * 1024),
      })
    }

    const ret1 = await client.listParts({ objectKey, uploadId })

    const ret2 = await client.listParts({ objectKey, uploadId, limit: 2 })

    const ret3 = await client.listParts({ objectKey, uploadId, limit: 2, marker: ret2.nextMarker })

    expect(ret3.items).toEqual(ret1.items.slice(2, 4))
  })
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

describe('listMultipart', () => {
  it('should return listMultipart', async () => {
    const ret = await client.listMultipartUpload()
    expect(ret.items).toBeArray()
    expect(ret.isTruncated).toBeFalse()
    expect(ret.limit)
  })

  it('should return listMultipart with limit', async () => {
    for (let i = 0; i < 5; i++) {
      await client.initMultipartUpload({ objectKey: randomObjectKey() })
    }

    const ret = await client.listMultipartUpload({ limit: 3 })

    expect(ret.items).toHaveLength(3)
    expect(ret.isTruncated).toBeTrue()
    expect(ret.limit).toBe(3)
  })

  it('should return listMultipart with marker', async () => {
    for (let i = 0; i < 5; i++) {
      await client.initMultipartUpload({ objectKey: randomObjectKey() })
    }

    const ret1 = await client.listMultipartUpload({ limit: 5 })
    const ret2 = await client.listMultipartUpload({ limit: 2 })
    const ret3 = await client.listMultipartUpload({ limit: 2, marker: ret2.nextMarker })

    expect(ret3.items).toEqual(ret1.items.slice(2, 4))
  })
})

describe('putBigObject', async () => {
  it('should upload success', async () => {
    jest.setTimeout(60 * 1000)
    const body = newReadableStream(1024 * 1024) // 1M
    const key = randomObjectKey()

    const res = await client.putBigObject({
      body,
      objectKey: key,
      maxPart: 1024 * 128, // 128k
      parallel: 1,
    })

    expect(res.key).toEqual(key)

    await expect(client.isObjectExist({ objectKey: key })).resolves.toBeTrue()
  })

  it('should upload local file success', async () => {
    const key = randomObjectKey('.jpg')
    const res = await client.putBigObject({
      file: join(__dirname, '../files/lena.jpg'),
      objectKey: key,
      parallel: 1,
    })

    expect(res.key).toEqual(key)

    await expect(client.isObjectExist({objectKey: key})).resolves.toBeTrue()
  })
})
