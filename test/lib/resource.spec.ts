import { getResourceString, getResourceUri } from '../../src/lib/resource'
import { Resource } from '../../src/type/resource'

type Tests = {
  [k: string]: [Resource, string][]
}

function doTests(tests: Tests, testFunc: (res: Resource) => string) {
  for (const [name, subTests] of Object.entries(tests)) {
    it(name, () => {
      for (const test of subTests) {
        expect(testFunc(test[0])).toBe(test[1])
      }
    })
  }
}

describe('getResourceUri', () => {
  const tests: Tests = {
    'empty resource': [[{}, '/']],
    'bucket resource': [
      [{ bucket: 'bucket' }, '/'],
      [{ bucket: 'bucket', acl: true }, '/?acl'],
      [{ bucket: 'bucket', location: true }, '/?location'],
    ],
    'objectKey resource': [
      [{ bucket: 'bkt', objectKey: 'obj' }, '/obj'],
      [{ bucket: 'bkt', objectKey: 'obj', partNumber: 1 }, '/obj?partNumber=1'],
      [{ bucket: 'bkt', objectKey: 'obj', uploads: true }, '/obj?uploads'],
    ],
    'objectKey resource with directory': [
      [{ bucket: 'bkt', objectKey: 'dir/obj' }, '/dir/obj'],
      [{ bucket: 'bkt', objectKey: '/dir/obj' }, '/dir/obj'],
      [{ bucket: 'bkt', objectKey: 'dir/obj', uploads: true }, '/dir/obj?uploads'],
    ],
  }

  doTests(tests, getResourceUri)
})

describe('getResourceString', () => {
  const tests: Tests = {
    'bucket resource': [
      [{ bucket: 'bucket' }, '/bucket/'],
      [{ bucket: 'bucket', acl: true }, '/bucket/?acl'],
      [{ bucket: 'bucket', location: true }, '/bucket/?location'],
    ],
    'objectKey resource': [
      [{ bucket: 'bkt', objectKey: 'obj' }, '/bkt/obj'],
      [{ bucket: 'bkt', objectKey: 'obj', partNumber: 1 }, '/bkt/obj?partNumber=1'],
      [{ bucket: 'bkt', objectKey: 'obj', uploads: true }, '/bkt/obj?uploads'],
    ],
    'objectKey resource with directory': [
      [{ bucket: 'bkt', objectKey: 'folder/file' }, '/bkt/folder%2Ffile'],
      [{ bucket: 'bkt', objectKey: '/folder/file' }, '/bkt/folder%2Ffile'],
      [{ bucket: 'bkt', objectKey: 'dir/obj', uploads: true }, '/bkt/dir%2Fobj?uploads'],
    ],
  }

  doTests(tests, getResourceString)
})
