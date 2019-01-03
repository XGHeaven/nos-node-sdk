import * as path from 'path'
import { Resource } from '../type/resource'
import * as qs from 'querystring'
import { map, sort, pipe, join, ascend, omit, pick } from 'ramda'
import { compact } from 'ramda-adjunct'
import { compactObject } from './util'
import * as url from 'url'

// stringify query
const commonQueryStringify = pipe(
  Object.entries,
  map(([key, value]) => {
    if (typeof value === 'boolean') {
      return value ? key : ''
    }
    return `${key}=${qs.escape(value)}`
  }),
  compact,
  sort(ascend(v => v)),
  join('&')
)

const uriQueryStringify = pipe(
  omit(['bucket', 'objectKey']),
  commonQueryStringify
)

const resourceQueryStringify = pipe(
  pick(['acl', 'location', 'uploadId', 'uploads', 'partNumber', 'delete']),
  commonQueryStringify
)

/**
 * normalize object key
 * 1. remove prefix /
 *  /obj => obj, /dir/obj => dir/obj
 * @param key
 */
export function normalizeObjectKey(key: string) {
  return path.posix.join(...key.split('/'))
}

export function getResourceUri(resource: Resource) {
  if (typeof resource === 'string') return resource

  const query = uriQueryStringify(resource)
  const urlObj = {
    pathname: '/',
    search: query,
  }
  if ('objectKey' in resource) {
    urlObj.pathname = url.resolve(urlObj.pathname, normalizeObjectKey(resource.objectKey))
  }

  return url.format(urlObj)
}

export function getResourceString(resource: Resource) {
  if (typeof resource === 'string') return resource
  const query = resourceQueryStringify(resource)
  if ('objectKey' in resource) {
    return url.format({
      pathname: path.posix.join('/', resource.bucket, normalizeObjectKey(resource.objectKey)),
      search: query,
    })
    // return `/${resource.bucket}/${qs.escape(resource.objectKey)}${query ? '?' + query : ''}`
  } else if ('bucket' in resource) {
    return `/${resource.bucket}/${query ? '?' + query : ''}`
  }
  return '/'
}

export function mergeResource(dest: Resource, ...srcs: Resource[]) {
  Object.assign(dest, ...srcs.map(compactObject))
}
