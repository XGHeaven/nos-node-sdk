import { NoBucketError } from '../src'
import { newClientWithoutBucket, randomBucketName } from './helpers/client'

const client = newClientWithoutBucket()

describe('validateParams', () => {
  it('should return defaultBucket when params is empty', () => {
    const bucket = randomBucketName()
    client.options.defaultBucket = bucket
    const result = (client as any).validateParams({})
    expect(result.bucket).toBe(bucket)
  })

  it('should throw NoBucketError when no bucket choose', () => {
    client.options.defaultBucket = ''
    expect(() => (client as any).validateParams({})).toThrow(NoBucketError)
  })
})
