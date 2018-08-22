import { createHmac } from 'crypto'
import { join, map, pickBy, pipe, prop, sortBy, toLower, toPairs } from 'ramda'
import { renameKeysWith } from 'ramda-adjunct'
import { Resource } from '../type/resource'
import { getResourceString } from './resource'

// lower-case header name
const normalizeHeaders = renameKeysWith(toLower)

const canonicalizedHeaders = pipe<object, object, [string, any][], [string, any][], string[], string>(
  pickBy((_, key) => key.startsWith('x-nos-')),
  toPairs,
  sortBy(prop('0')),
  map(join(':')),
  join('\n')
)

const normalizeDate = function(date: any) {
  return new Date(date).toUTCString()
}

const joinParts = join('\n')

export function signature(secretKey: string, verb: string, headers: any, resource: Resource) {
  headers = normalizeHeaders(headers)

  const contentMD5 = headers['content-md5'] || ''
  const contentType = headers['content-type'] || ''
  const date = normalizeDate(headers['date'] || Date.now())

  const parts = [
    verb.toUpperCase(),
    contentMD5,
    contentType,
    date,
    `${canonicalizedHeaders(headers)}\n${getResourceString(resource)}`.trim(),
  ]
  const hmac = createHmac('sha256', secretKey)

  const content = joinParts(parts)
  hmac.update(content)
  return hmac.digest('base64')
}
