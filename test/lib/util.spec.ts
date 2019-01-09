import { Callbackable, encodeKey } from '../../src/lib/util'

describe('Callbackable', () => {
  it('should support callback for async function', async () => {
    class TestClass {
      @Callbackable
      async asyncFunc(): Promise<number> {
        return 1
      }
    }

    interface TestClass {
      asyncFunc(cb: (e: Error, d: number) => void): void
    }

    const inst = new TestClass()

    await expect(inst.asyncFunc()).resolves.toEqual(1)
    const result = await new Promise((resolve, reject) => {
      inst.asyncFunc((e, d) => {
        if (e) return reject(e)
        resolve(d)
      })
    })
    expect(result).toEqual(1)
  })
})

describe('encodeKey', () => {
  it.each([
    ['abc.jpg', 'abc.jpg'],
    ['中国.jpg', '%E4%B8%AD%E5%9B%BD.jpg'],
    ['a/b/c.jpg', 'a/b/c.jpg'],
    ['/a!@#$/p.jpg', 'a%21%40%23%24/p.jpg'],
    ['/a/b.png', 'a/b.png'],
    ['abc_def', 'abc_def'],
  ])('encode %s to %s', (input, expected) => {
    expect(encodeKey(input)).toEqual(expected)
  })
})
