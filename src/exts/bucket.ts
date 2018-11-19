import * as dateFns from 'date-fns'
import { NosBaseClient } from '../client'
import { NosError } from '../lib/error'
import { Callbackable, normalizeArray } from '../lib/util'
import {
  Bucket,
  BucketAcl,
  BucketLocation,
  ListBucketResult,
  OperateBucketParams,
  PutBucketParams,
  SetBucketAclParams,
} from '../type/bucket'
import { Callback } from '../type/callback'
import { ResourceBucket } from '../type/resource'
import { pick } from 'ramda'

export class NosClientBucketExt extends NosBaseClient {
  /**
   * 获取全部 Bucket
   */
  listBucket(): Promise<ListBucketResult>
  listBucket(cb: Callback<ListBucketResult>): void
  @Callbackable
  async listBucket(): Promise<ListBucketResult> {
    const data = await this.requestBody(
      'get',
      {
        host: `${this.options.host}`,
      },
      {}
    )

    let buckets = normalizeArray(data.listAllMyBucketsResult.buckets.bucket)

    for (const bkt of buckets) {
      // creationDate is string get from response
      bkt.creationDate = dateFns.parse(bkt.creationDate)
    }

    return {
      ...(pick(['owner'], data.listAllMyBucketsResult) as any),
      items: buckets,
      isTruncated: false,
      limit: buckets.length,
      nextMarker: '',
    }
  }

  /**
   * 添加一个 Bucket
   * @param params
   * @param params
   */
  putBucket(params: PutBucketParams): Promise<void>
  putBucket(params: PutBucketParams, cb: Callback<void>): void
  @Callbackable
  async putBucket(params: PutBucketParams): Promise<void> {
    const { headers, resource } = this.validateParams(params)

    if (params.acl) {
      headers['x-nos-acl'] = params.acl
    }

    await this.requestBody('put', headers, resource, {
      createBucketConfiguration: {
        locationConstraint: params.location || BucketLocation.HZ,
      },
    })
  }

  /**
   * 确保 Bucket 存在。如果不存在，会自动创建，如果存在，不做任何操作。
   */
  ensureBucket(params: PutBucketParams): Promise<void>
  ensureBucket(params: PutBucketParams, cb: Callback<void>): void
  @Callbackable
  async ensureBucket(params: PutBucketParams): Promise<void> {
    try {
      return await this.putBucket(params)
    } catch (e) {
      if (e instanceof NosError && e.name === 'BucketAlreadyOwnedByYou') {
        return
      }
      throw e
    }
  }

  /**
   * 检查一个 Bucket 是否存在
   */
  isBucketExist(params: OperateBucketParams): Promise<boolean>
  isBucketExist(params: OperateBucketParams, cb: Callback<boolean>): void
  @Callbackable
  async isBucketExist(params: OperateBucketParams): Promise<boolean> {
    const { headers, resource } = this.validateParams(params)
    const resp = await this._request('head', headers, resource)

    if (resp.status === 404) return false
    await this.handleRequestError(resp)
    return true
  }

  /**
   * 删除 Bucket
   */
  deleteBucket(params: OperateBucketParams): Promise<void>
  deleteBucket(params: OperateBucketParams, cb: Callback<void>): void
  @Callbackable
  async deleteBucket(params: OperateBucketParams): Promise<void> {
    const { headers, resource } = this.validateParams(params)

    try {
      await this.request('delete', headers, resource)
    } catch (e) {
      if (e instanceof NosError && e.name === 'NoSuchBucket') {
        return
      }
      throw e
    }
  }

  /**
   * 获取 Bucket 的权限
   */
  getBucketAcl(params: OperateBucketParams): Promise<BucketAcl>
  getBucketAcl(params: OperateBucketParams, cb: Callback<BucketAcl>): void
  @Callbackable
  async getBucketAcl(params: OperateBucketParams): Promise<BucketAcl> {
    const { headers, resource } = this.validateParams(params)
    ;(resource as ResourceBucket).acl = true

    const resp = await this.request('get', headers, resource)

    // make sure x-nos-acl exist
    return resp.headers.get('x-nos-acl') as BucketAcl
  }

  /**
   * 设置 Bucket 的权限
   */
  setBucketAcl(params: SetBucketAclParams): Promise<void>
  setBucketAcl(params: SetBucketAclParams, cb: Callback<void>): void
  @Callbackable
  async setBucketAcl(params: SetBucketAclParams): Promise<void> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { acl: true })
    headers['x-nos-acl'] = params.acl
    await this.request('put', headers, resource)
  }

  /**
   * 获取 Bucket 的地域位置
   */
  getBucketLocation(params: OperateBucketParams): Promise<BucketLocation>
  getBucketLocation(params: OperateBucketParams, cb: Callback<BucketLocation>): void
  @Callbackable
  async getBucketLocation(params: OperateBucketParams): Promise<BucketLocation> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { location: true })
    const result = await this.requestBody('get', headers, resource)
    return result.locationConstraint
  }

  /*
  @Callbackable
  async getBucketDefault404(params: OperateBucketParams): Promise<string> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { default404: true })
    const result = await this.requestBody('get', headers, resource)
    return result.default404Configuration.key || ''
  }

  @Callbackable
  async setBucketDefault404(params: SetBucketDefault404Params): Promise<void> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { default404: true })
    await this.request('put', headers, resource, {
      default404Configuration: {
        key: params.objectKey,
      },
    })
  }*/

  /*
  async getBucketWebsite(params: OperateBucketParams): Promise<BucketWebsite> {
    const {headers,resource} = this.validateParams(params)
    Object.assign(resource, {website: true})
    const res = await this.requestBody('get', headers, resource)
    return {
      indexDocument: res.websiteConfiguration.indexDocument.suffix,
      errorDocument: res.websiteConfiguration.errorDocument.suffix
    }
  }
  */
}
