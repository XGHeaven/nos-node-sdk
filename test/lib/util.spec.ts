import { Callbackable } from '../../src/lib/util'

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
