import * as fs from 'fs'
import fetch from 'node-fetch'
import { NosClient } from '../../src'
import { stream2Buffer } from '../../src/lib/util'
import {
  cleanBucket,
  cleanClient,
  deleteBucket,
  newBucket,
  newClient,
  putRandomObject,
  randomObjectKey,
} from '../helpers/client'
import { newTempFile } from '../helpers/runtime'

let client: NosClient

beforeAll(async () => {
  client = await newClient()
})

afterAll(async () => {
  await cleanClient(client)
})

describe('listObject', async () => {
  beforeEach(async () => {
    await cleanBucket(client, client.options.defaultBucket as string)
  })

  it('list objects when bucket is empty', async () => {
    const ret = await client.listObject()
    expect(ret.items).toHaveLength(0)
    expect(ret.limit).toBe(100)
    expect(ret.isTruncated).toBeFalse()
    expect(ret.commonPrefixes).toBeEmpty()
    expect(ret.prefix).toBe('')
    expect(ret.bucket).toBe(client.options.defaultBucket)
  })

  it('list objects', async () => {
    await putRandomObject(client, 5)
    const result = await client.listObject()
    expect(result.items).toHaveLength(5)
    expect(result.isTruncated).toBeFalse()
  })

  it('list objects with prefix', async () => {
    const objectKey = randomObjectKey()
    await client.putObject({ objectKey: `test-prefix-${objectKey}`, body: 'random' })
    const result = await client.listObject({ prefix: 'test-prefix' })
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('list objects with dir prefix', async () => {
    const key = randomObjectKey()
    await client.putObject({ objectKey: `list-prefix/${key}`, body: 'dir' })
    const result = await client.listObject({ prefix: 'list-prefix/' })
    expect(result.items).toBeArray()
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('list objects with limit', async () => {
    await putRandomObject(client, 6)

    const result = await client.listObject({ limit: 5 })
    expect(result.items).toHaveLength(5)
    expect(result.isTruncated).toBeTrue()
  })

  it('list objects with delimiter', async () => {
    const prefix = 'list-object-delimiter/'
    await putRandomObject(client, 2, () => randomObjectKey('.txt', prefix))
    await putRandomObject(client, 5)

    const result = await client.listObject({
      limit: 5,
      delimiter: '/',
    })

    expect(result.items).toHaveLength(4)
    expect(result.commonPrefixes).toHaveLength(1)
    expect(result.commonPrefixes[0]).toEqual({ prefix })
    expect(result.isTruncated).toBeTrue()
    expect(result.delimiter).toBe('/')
  })

  it('list objects with marker', async () => {
    await putRandomObject(client, 5)

    const ret1 = await client.listObject({
      limit: 3,
    })

    const ret2 = await client.listObject({
      limit: 2,
    })

    const ret3 = await client.listObject({
      limit: 2,
      marker: ret2.nextMarker,
    })

    // 最后一个等于第一个
    expect(ret1.items[2]).toEqual(ret3.items[0])
  })
})

describe('putObject', () => {
  it.each([
    ['chinese', '中文'],
    ['()', 'char(0)()'],
    ['!@#$%', 'char!@#$%!@#$%'],
    ['^&*()', 'xx^&*()'],
    ['~`[]{}\\|', 'xx~`[]{}\\|'],
    [',.<>?', 'xx,.<>?']
  ])('upload file which objectKey has %s', async (type, char) => {
    const objectKey = `${char}-${randomObjectKey()}`
    const content = 'xxxx'
    await client.putObject({
      objectKey,
      body: content,
    })
  })

  it('upload file with string', async () => {
    const objectKey = randomObjectKey()
    const content = 'test-upload-file-with-string'
    const result = await client.putObject({
      objectKey,
      body: content,
    })

    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"3494c1c93780e53544037b306a2eb408\\"",
}
`)
  })

  it('upload buffer file', async () => {
    const buf = Buffer.from('test buffer')
    const objectKey = randomObjectKey()
    const result = await client.putObject({
      objectKey,
      body: buf,
    })
    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"3cb17c1f997929325ca6b97d71dae4c1\\"",
}
`)
  })

  it('upload stream file', async () => {
    const filePath = await newTempFile({
      content: 'test-content',
    })

    const stream = fs.createReadStream(filePath)
    const objectKey = randomObjectKey()

    const result = await client.putObject({
      objectKey,
      body: stream,
    })
    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"9749fad13d6e7092a6337c4af9d83764\\"",
}
`)
  })

  it('upload stream file with length', async () => {
    const content = 'test-length'
    const filePath = await newTempFile({ content })

    const stream = fs.createReadStream(filePath)
    const objectKey = randomObjectKey()

    const result = await client.putObject({
      objectKey,
      body: stream,
      length: content.length,
    })

    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"c35c739c0c33feda929ee779b76a7662\\"",
}
`)
  })

  it('upload local file', async () => {
    const content = 'test-local'
    const file = await newTempFile({ content })
    const objectKey = randomObjectKey()
    const result = await client.putObject({
      objectKey,
      file,
    })
    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"b3bcabeb747afc2a77ee1ba11a47075f\\"",
}
`)
  })

  it('upload file with folder', async () => {
    const objKey = randomObjectKey('.txt')
    const result = await client.putObject({
      objectKey: `upload-file-with-folder/${objKey}`,
      body: 'file-with-folder',
    })

    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"0140a8331edefa0609a60ad6704aa317\\"",
}
`)
  })

  it('upload file with folder prefixed /', async () => {
    const result = await client.putObject({
      objectKey: `/upload-file-with-folder/${randomObjectKey('.txt')}`,
      body: '/file-with-folder',
    })

    expect(result).toMatchInlineSnapshot(`
Object {
  "eTag": "\\"0f7a33fab7f6af27e3e02f8edc6cd639\\"",
}
`)
  })
})

describe('deleteObject', () => {
  it('should return when delete object success', async () => {
    const objectKey = randomObjectKey()
    await client.putObject({ objectKey, body: 'xxx' })

    await expect(client.isObjectExist({ objectKey })).resolves.toBeTrue()

    await client.deleteObject({ objectKey })
    await expect(client.isObjectExist({ objectKey })).resolves.toBeFalse()
  })

  it('should success when delete objectKey with special character', async () => {
    const objectKey = randomObjectKey('.txt', '中文@#$%^/*(0)/')
    await client.putObject({ objectKey, body: 'special character'})

    await expect(client.isObjectExist({objectKey})).resolves.toBeTrue()

    await client.deleteObject({objectKey})
    await expect(client.isObjectExist({objectKey})).resolves.toBeFalse()
  })

  it.skip('should return false when delete object that do not exist', async () => {
    const objectKey = randomObjectKey()
    client.deleteObject({ objectKey })
  })
})

describe('headObject', () => {
  it('head object', async () => {
    const tempFile = await newTempFile({
      content: 'hello world',
      ext: '.txt',
    })
    const remoteFile = randomObjectKey('.txt')

    await client.putObject({ objectKey: remoteFile, file: tempFile })

    const result = await client.headObject({ objectKey: remoteFile })

    expect(result).toHaveProperty('contentType', 'text/plain')
    expect(result).toHaveProperty('eTag')
    expect(result).toHaveProperty('metadata')
  })

  it.skip('head object with ifModifiedSince', async () => {
    const objectKey = randomObjectKey('.txt')
    const content = 'head object'
    await client.putObject({ objectKey, body: content })
    const result = await client.headObject({ objectKey, ifModifiedSince: new Date(Date.now()) })
    console.log(result)
  })
})

describe('getObject', () => {
  let content: string = 'This is a test file of get object'
  let objectKey: string = randomObjectKey('.txt')

  beforeAll(async () => {
    await client.putObject({ objectKey, body: content })
  })

  it('should return string when encode is utf-8', async () => {
    const body = await client.getObject({ objectKey, encode: 'utf-8' })
    expect(body).toBe(content)
  })

  it('should return buffer when encode is buffer', async () => {
    const body = await client.getObject({ objectKey, encode: 'buffer' })
    expect(body.toString()).toEqual(content)
  })

  it('should return stream when encode is stream', async () => {
    const body = await client.getObject({ objectKey, encode: 'stream' })
    expect((await stream2Buffer(body)).toString()).toEqual(content)
  })

  it.each([
    ['first-last', '0-5', content.slice(0, 6)],
    ['first-', '3-', content.slice(3)],
    ['-last', '-3', content.slice(0, 4)],
    ['first-last obj', { first: 3, last: 5 }, content.slice(3, 6)],
    ['first- obj', { first: 3 }, content.slice(3)],
    ['-last obj', { last: 5 }, content.slice(0, 6)],
  ])('should get object slice when range is %s', async (title: string, range: any, value: string) => {
    const body = await client.getObject({
      objectKey,
      encode: 'utf-8',
      range,
    })

    expect(body).toEqual(value)
  })

  it('should return `ifNotFound` content when origin object do not exist', async () => {
    const body = await client.getObject({
      objectKey: 'absolute-not-found-key-iphonex-pixel-xl-3.y',
      ifNotFound: objectKey,
      encode: 'utf-8',
    })

    expect(body).toEqual(content)
  })
})

describe('moveObject', () => {
  it.each([
    ['in same bucket', {}, {}],
    // NOT IMPLEMENTED ['in different bucket', {}, {}],
    ['source object in a folder', { key: randomObjectKey('', 'move-folder/') }, {}],
    ['target object in a folder', {}, { key: randomObjectKey('', 'move-folder/') }],
    ['source objectKey is special string', { key: randomObjectKey('', '中文@#$%/') }, {}],
    ['target objectKey is special string', {}, { key: randomObjectKey('', '中国^&*(0)/') }],
  ])('should ok when %s', async (title, source, target) => {
    const sourceKey = source.key || randomObjectKey()
    const targetKey = target.key || randomObjectKey()
    // default same bucket
    const content = `move object ${title}`

    await client.putObject({ objectKey: sourceKey, body: content })
    await client.moveObject({
      sourceObjectKey: sourceKey,
      targetObjectKey: targetKey,
    })
    await expect(client.isObjectExist({ objectKey: targetKey })).resolves.toBeTrue()
    await expect(client.isObjectExist({ objectKey: sourceKey })).resolves.toBeFalse()
    await expect(client.getObject({ objectKey: targetKey, encode: 'utf-8' })).resolves.toEqual(content)
  })

  it('should throw error when targetBucket is not equal sourceBucket', async () => {
    await expect(
      client.moveObject({
        sourceObjectKey: randomObjectKey(),
        targetObjectKey: randomObjectKey(),
        sourceBucket: 'xxx',
        targetBucket: 'bbb',
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"sourceBucket must be equal to targetBucket: https://www.163yun.com/help/documents/45669971175591936"`
    )
  })
})

describe('copyObject', () => {
  let bucket1: string
  let bucket2: string

  beforeAll(async () => {
    bucket1 = client.options.defaultBucket as string
    bucket2 = await newBucket(client)
  })

  afterAll(async () => {
    await deleteBucket(client, bucket2)
  })

  it.each([
    ['in same bucket', {}, { bucket: () => bucket1 }],
    ['in different bucket', {}, {}],
    ['source object in a folder', { key: randomObjectKey('', 'copy-file-folder') }, {}],
    ['target object in a folder', {}, { key: randomObjectKey('', 'copy-file-folder') }],
    ['source objectKey is special string', { key: randomObjectKey('', '中文@#$%/') }, {}],
    ['target objectKey is special string', {}, { key: randomObjectKey('', '中国^&*(0)/') }],
  ])('should ok when %s', async (title, source, target) => {
    const sourceKey = source.key || randomObjectKey()
    const targetKey = target.key || randomObjectKey()
    const sourceBucket = typeof source.bucket === 'function' ? source.bucket() : (source.bucket || bucket1)
    const targetBucket = typeof target.bucket === 'function' ? target.bucket() : (target.bucket || bucket2)
    const content = 'copy file ' + title

    await client.putObject({ objectKey: sourceKey, body: content, bucket: sourceBucket })
    await expect(client.isObjectExist({ objectKey: sourceKey })).resolves.toBeTrue()

    await client.copyObject({
      sourceObjectKey: sourceKey,
      sourceBucket: sourceBucket,
      targetObjectKey: targetKey,
      targetBucket: targetBucket,
    })
    await expect(client.isObjectExist({ objectKey: targetKey, bucket: targetBucket })).resolves.toBeTrue()

    await expect(client.getObject({ objectKey: targetKey, encode: 'utf-8', bucket: targetBucket })).resolves.toEqual(
      content
    )
  })
})

describe('getObjectUrl', () => {
  it('should return object url', async () => {
    const file = randomObjectKey()
    await client.putObject({ objectKey: file, body: 'file' })
    const url = await client.getObjectUrl({ objectKey: file, expires: 1000 })

    expect(url).toBeTruthy()

    const resp = await fetch(url)
    const text = await resp.text()
    expect(text).toEqual('file')
  })
})

describe('deleteMultiObject', () => {
  it('should return empty array when delete multi object all success', async () => {
    const file1 = randomObjectKey()
    const file2 = randomObjectKey()
    const file3 = randomObjectKey('', '中文!@#%^$/#^$*@#(0)/')
    const data = Buffer.from('test-content')
    await Promise.all([
      client.putObject({ objectKey: file1, body: data }),
      client.putObject({ objectKey: file2, body: data }),
      client.putObject({ objectKey: file3, body: data }),
    ])

    const result = await client.deleteMultiObject({ objectKeys: [file1, file2, file3] })
    await expect(result).toHaveLength(0)
  })

  it('should return array with error when have files delete error', async () => {
    const file1 = randomObjectKey()
    const file2 = randomObjectKey()
    const data = Buffer.from('test-content')

    await Promise.all([client.putObject({ objectKey: file1, body: data })])

    const result = await client.deleteMultiObject({ objectKeys: [file1, file2] })
    expect(result).toHaveLength(1)
    expect(result[0].key).toEqual(file2)
  })
})
