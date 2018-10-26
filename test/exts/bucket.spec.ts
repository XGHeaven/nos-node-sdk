import { NosClient } from '../../src'
import { BucketAcl, BucketLocation } from '../../src/type/bucket'
import { cleanClient, deleteBucket, newClient, randomBucketName } from '../helpers/client'

let client: NosClient
let bucket: string
const buckets: string[] = []

beforeAll(async () => {
  client = await newClient()
  bucket = client.options.defaultBucket as string
})

afterAll(async () => {
  for (const bucket of buckets) {
    await deleteBucket(client, bucket)
  }

  await cleanClient(client)
})

describe('listBucket', () => {
  it('should return buckets', async () => {
    const ret = await client.listBucket()
    expect(ret.items).toBeArray()
    expect(ret.nextMarker).toBe('')
    expect(ret.isTruncated).toBeFalse()
    expect(ret.limit).toBe(ret.items.length)
    expect(ret.nextMarker).toBe('')
  })
})

describe('putBucket', async () => {
  it('should ok', async () => {
    const bucket = randomBucketName()
    await client.putBucket({ bucket })
    buckets.push(bucket)
    await expect(client.isBucketExist({ bucket })).resolves.toBeTrue()
  })
})

describe('deleteBucket', async () => {
  it('should ok when bucket exist', async () => {
    const bucket = randomBucketName()
    await client.putBucket({ bucket })
    await client.deleteBucket({ bucket })
    await expect(client.isBucketExist({ bucket })).resolves.toBeFalse()
  })

  it('should return when bucket is not exist', async () => {
    await client.deleteBucket({ bucket: 'absolute-do-not-exist-bucket-' + Date.now() })
  })

  it('should throw error when delete other user bucket', async () => {
    await expect(client.deleteBucket({ bucket: 'nos' })).rejects.toThrowError()
  })
})

describe('getBucketAcl', () => {
  it('should return bucket acl', async () => {
    const acl = await client.getBucketAcl({ bucket: '' })
    expect(acl).toBe(BucketAcl.PRIVATE)
  })
})

describe('setBucketAcl', () => {
  let bucket = randomBucketName()

  beforeEach(async () => {
    await client.putBucket({ bucket })
  })

  afterEach(async () => {
    await deleteBucket(client, bucket)
  })

  it('should set bucket acl', async () => {
    await expect(client.getBucketAcl({ bucket })).resolves.toEqual(BucketAcl.PRIVATE)
    await client.setBucketAcl({ bucket, acl: BucketAcl.PUBLISH })
    await expect(client.getBucketAcl({ bucket })).resolves.toEqual(BucketAcl.PUBLISH)
  })
})

describe('getBucketLocation', () => {
  it('should return bucket location', async () => {
    const location = await client.getBucketLocation({ bucket })
    expect(location).toBe(BucketLocation.HZ)
  })
})

describe.skip('getBucketDefault404', () => {
  // let bucket: string
  //
  // beforeAll(async () => {
  //   bucket = await newBucket(client)
  // })
  //
  // afterAll(async () => {
  //   await deleteBucket(client, bucket)
  // })
  //
  // it('should return empty bucket default 404', async () => {
  //   const default404 = await client.getBucketDefault404({ bucket })
  //   expect(default404).toBeEmpty()
  // })
})

describe.skip('setBucketDefault404', () => {
  // it('set bucket default 404', async () => {
  //   const key = randomObjectKey('.html')
  //   await client.setBucketDefault404({ bucket, objectKey: key })
  //
  //   await expect(client.getBucketDefault404({ bucket })).resolves.toBe(key)
  // })
})

describe('isBucketExist', () => {
  it('should return true when bucket exist', async () => {
    const exist = await client.isBucketExist({ bucket })
    expect(exist).toBeTruthy()
  })
})

/*describe('getBucketWebsite', () => {
  it('should return website', async () => {
    await expect(await client.getBucketWebsite({bucket})).toMatchInlineSnapshot()
  })
})*/
