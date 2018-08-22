import * as dateFns from 'date-fns'
import { NosBaseClient } from '../client'
import { NosError } from '../lib/error'
import { Callbackable, normalizeArray } from '../lib/util'
import {
  Bucket,
  BucketAcl,
  BucketLocation,
  OperateBucketParams,
  SetBucketAclParams,
  SetBucketDefault404Params,
} from '../type/bucket'
import { Callback } from '../type/callback'
import { PutBucketParams } from '../type/put-bucket'
import { ResourceBucket } from '../type/resource'

export class NosClientBucketExt extends NosBaseClient {
  /**
   * get all buckets
   */
  @Callbackable
  async listBucket(): Promise<Bucket[]> {
    const data = await this.requestBody(
      'get',
      {
        host: `${this.options.host}`,
      },
      {}
    )

    let buckets = normalizeArray(data.listAllMyBucketsResult.buckets.bucket)

    for (const bkt of buckets) {
      // creationDate is string get from request
      bkt.creationDate = dateFns.parse(bkt.creationDate)
    }
    return buckets
  }

  /**
   * add a bucket
   * @param params
   * @param params
   */
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
   * Ensure bucket exist, create bucket when no such bucket
   * Please make sure you is a owner of bucket, or throw error
   * @param params
   */
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

  @Callbackable
  async isBucketExist(params: OperateBucketParams): Promise<boolean> {
    const { headers, resource } = this.validateParams(params)
    const resp = await this._request('head', headers, resource)

    if (resp.status === 404) return false
    await this.handleRequestError(resp)
    return true
  }

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

  @Callbackable
  async getBucketAcl(params: OperateBucketParams): Promise<BucketAcl> {
    const { headers, resource } = this.validateParams(params)
    ;(resource as ResourceBucket).acl = true

    const resp = await this.request('get', headers, resource)

    // make sure x-nos-acl exist
    return resp.headers.get('x-nos-acl') as BucketAcl
  }

  @Callbackable
  async setBucketAcl(params: SetBucketAclParams): Promise<void> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { acl: true })
    headers['x-nos-acl'] = params.acl
    await this.request('put', headers, resource)
  }

  @Callbackable
  async getBucketLocation(params: OperateBucketParams): Promise<BucketLocation> {
    const { headers, resource } = this.validateParams(params)
    Object.assign(resource, { location: true })
    const result = await this.requestBody('get', headers, resource)
    return result.locationConstraint
  }

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
  }

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

export interface NosClientBucketExt {
  listBucket(cb: Callback<Bucket[]>): void
  putBucket(params: PutBucketParams, cb: Callback<void>): void
  ensureBucket(params: PutBucketParams, cb: Callback<void>): void
  isBucketExist(params: OperateBucketParams, cb: Callback<boolean>): void
  deleteBucket(params: OperateBucketParams, cb: Callback<void>): void
  getBucketAcl(params: OperateBucketParams, cb: Callback<BucketAcl>): void
  setBucketAcl(params: SetBucketAclParams, cb: Callback<void>): void
  getBucketLocation(params: OperateBucketParams, cb: Callback<BucketLocation>): void
  getBucketDefault404(params: OperateBucketParams, cb: Callback<string>): void
  setBucketDefault404(params: SetBucketDefault404Params, cb: Callback<void>): void
}
