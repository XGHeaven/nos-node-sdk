import * as crypto from 'crypto'
import { Headers } from 'node-fetch'
import { renameKeysWith, isNull, isUndefined } from 'ramda-adjunct'
import { map, concat, type, filter, identical, pickBy, pipe } from 'ramda'
import { ObjectMetadata } from '../type/object'
import ReadableStream = NodeJS.ReadableStream

export function camelCase(name: string): string {
  if (name === 'ID') return 'id'
  name = name.replace(/^[A-Z]/, m => m.toLowerCase())
  name = name.replace(/[-_][a-z]/g, m => m[1].toUpperCase())
  return name
}

export function CamelCase(name: string): string {
  if (name === 'id') return 'ID'
  name = name.replace(/^[a-z]/, m => m.toUpperCase())
  name = name.replace(/[-_][a-z]/g, m => m[1].toUpperCase())
  return name
}

export function kababCase(name: string): string {
  name = name.replace(/^[A-Z]/, m => m.toLowerCase())
  name = name.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)
  return name
}

function renameObjectNameFactory(renameFunc: (name: string) => string): (obj: any) => any {
  return function changeCase(obj: any): any {
    switch (type(obj)) {
      case 'Object':
        obj = renameKeysWith(renameFunc, obj)
        for (const [key, value] of Object.entries(obj)) {
          obj[key] = changeCase(value)
        }
        break
      case 'Array':
        for (let i = 0; i < obj.length; i++) {
          obj[i] = changeCase(obj[i])
        }
        obj = obj.slice() // clone
        break
    }

    return obj
  }
}

export const camelCaseObject = renameObjectNameFactory(camelCase)
export const CamelCaseObject = renameObjectNameFactory(CamelCase)
export const kababCaseObject = renameObjectNameFactory(kababCase)

export function stream2Buffer(stream: ReadableStream): Promise<Buffer> {
  const bufs: Buffer[] = []
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', buf => bufs.push(buf))
    stream.on('end', () => {
      resolve(Buffer.concat(bufs))
    })
    stream.on('error', reject)
  })
}

export const addMetadataPrefix = renameKeysWith(pipe(kababCase, concat('x-nos-')))
export function getMetadataFromHeaders(headers: Headers): ObjectMetadata {
  let keyIt = headers.keys()
  const metadata: ObjectMetadata = {}

  let res = keyIt.next()
  while(!res.done) {
    const key = res.value
    if (key.startsWith('x-nos-')) {
      metadata[key.slice(6)] = headers.get(key) as string
    }
    res = keyIt.next()
  }

  return camelCaseObject(metadata)
}

export function isHttpStatusOk(status: number): boolean {
  const firstNumber = Math.trunc(status / 100)
  return firstNumber === 2 || firstNumber === 3
}

export function md5sum(data: Buffer | string): string {
  return crypto.createHash('md5').update(data).digest('hex')
}

export const isNullOrUndefined = (a: any) => isNull(a) || isUndefined(a)
export const compactObject = filter<any>(e => !isNullOrUndefined(e))

// https://www.typescriptlang.org/docs/handbook/mixins.html
export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach(baseCtor => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
      derivedCtor.prototype[name] = baseCtor.prototype[name];
    });
  });
}

// decorator to add callback support of method
export function Callbackable(target: any, key: string, descr: PropertyDescriptor) {
  const fn = descr.value

  descr.value = function(...args: any[]) {
    if (typeof args[args.length - 1] === 'function') {
      const cb = args[args.length - 1]
      fn.apply(this, args.slice(0, -1)).then((data: any) => cb(null, data)).catch((e: any) => cb(e, null))
      return
    }

    return fn.apply(this, args)
  }
}

// make sure value is array
// if value is undefined or null, return []
// if value is not array, wrapper as array
// return value
export function normalizeArray(value: any): Array<any> {
  if (!value) {
    return []
  }

  if (type(value) !== 'Array') {
    return [value]
  }

  return value
}
