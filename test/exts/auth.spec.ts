import { NosClient, Token } from '../../src'
import { cleanClient, newClient, randomObjectKey, uploadUseToken } from '../helpers/client'

let client: NosClient
let bucket: string

beforeAll(async () => {
  client = await newClient()
  bucket = client.options.defaultBucket as string
})

afterAll(async () => {
  await cleanClient(client)
})

function joinToken(token: Token) {
  return `${client.options.accessKey}:${token.sign}:${token.putPolicy}`
}

describe('createToken', () => {
  it('should create token success', async () => {
    const objectKey = randomObjectKey()
    const token = client.createToken({
      objectKey,
      expires: Date.now() + 3600 * 1000,
    })

    const ret = await uploadUseToken(`${client.options.accessKey}:${token.sign}:${token.putPolicy}`, bucket, objectKey, 'xxxxxx')
    expect(ret).toBeTrue()

    await expect(client.isObjectExist({objectKey})).resolves.toBeTrue()
  })

  it('should limit size', async () => {
    const objectKey = randomObjectKey()
    const minSize = 4
    const maxSize = 16
    const token = client.createToken({
      objectKey,
      expires: Date.now() + 3600 * 1000,
      objectSizeMin: minSize,
      objectSizeMax: maxSize,
    })

    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x'.repeat(3))).resolves.toBeFalse()
    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x'.repeat(10))).resolves.toBeTrue()
    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x'.repeat(20))).resolves.toBeFalse()
  })

  it('should mime limit works', async () => {
    const objectKey = randomObjectKey('.jpg')
    const token = client.createToken({
      objectKey,
      expires: Date.now() + 3600 * 1000,
      mimeLimit: ['image/jpg', 'image.png']
    })

    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x')).resolves.toBeFalse()
    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x', {
      'content-type': 'image/jpg'
    })).resolves.toBeTrue()
    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x', {
      'content-type': 'text/plain'
    })).resolves.toBeFalse()
  })

  it('should overwrite=true works', async () => {
    const objectKey = randomObjectKey()
    const token = client.createToken({
      objectKey,
      expires: Date.now() + 3600 * 1000,
      overwrite: true
    })

    for (let i = 0; i < 2; i++) {
      await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x')).resolves.toBeTrue()
    }
  })

  it('should overwrite=false works', async () => {
    const objectKey = randomObjectKey()
    const token = client.createToken({
      objectKey,
      expires: Date.now() + 3600 * 1000,
      overwrite: false
    })

    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x')).resolves.toBeTrue()
    await expect(uploadUseToken(joinToken(token), bucket, objectKey, 'x')).resolves.toBeFalse()
  })
})

describe('createTokenString', () => {
  it('should equal with createToken', () => {
    const objectKey = randomObjectKey()
    const expires = Date.now()
    const token = client.createToken({
      objectKey,
      expires
    })

    const tokenString = client.createTokenString({objectKey, expires})

    expect(tokenString).toEqual(`${client.options.accessKey}:${token.sign}:${token.putPolicy}`)
  })
})
