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
 *  /obj => obj, dir/obj => dir%2Fobj
 * @param key
 */
export function escapeObjectKey(key: string) {
  return key.replace(/\//g, '%2F')
}

/**
 * 获取资源路径，不对 / 进行转义
 * @param resource
 */
export function getResourceUri(resource: Resource) {
  if (typeof resource === 'string') return resource

  const query = uriQueryStringify(resource)
  const urlObj = {
    pathname: '/',
    search: query,
  }
  if ('objectKey' in resource) {
    urlObj.pathname = url.resolve(urlObj.pathname, resource.objectKey)
  }

  return url.format(urlObj)
}

/**
 * 获取资源字符串，对 objectKey 进行转义，保证 objectKey 没有前置 /
 * @param resource
 */
export function getResourceString(resource: Resource) {
  if (typeof resource === 'string') return resource
  const query = resourceQueryStringify(resource)
  if ('objectKey' in resource) {
    return url.format({
      pathname: path.posix.join('/', resource.bucket, escapeObjectKey(resource.objectKey)),
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
