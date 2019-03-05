import { OperateObjectParams } from '..'
import { NosBaseClient } from '../client'
import { createHmac } from 'crypto'

export interface CreateTokenParams extends OperateObjectParams {
  /**
   * 过期时间，单位毫秒。（NOS 只要求秒级，但是为了减少转化过程，只需要传入毫秒即可）
   */
  expires: number
  /**
   * 对象的最小上传大小
   */
  objectSizeMin?: number
  /**
   * 对象的最大上传大小
   */
  objectSizeMax?: number
  /**
   * 对象类型限制，可以传入 `'image/png;image/jpg'` 字符串或者 `['image/png', 'image/jpg']` 数组
   */
  mimeLimit?: string | string[]
  /**
   * 是否允许覆盖上传，默认允许
   */
  overwrite?: boolean
}

export interface Token {
  /**
   * 上传凭证
   */
  putPolicy: string
  /**
   * 签名
   */
  sign: string
}

export class NosClientAuthExt extends NosBaseClient {
  /**
   * 创建上传凭证，返回 Token 对象，里面有 `putPolicy` 和 `sign` 字段，前端可以通过此构建上传 Token
   * @param params
   */
  createToken(params: CreateTokenParams): Token {
    const putPolicyObject = {
      Bucket: params.bucket || this.options.defaultBucket,
      Object: params.objectKey,
      Expires: Math.floor(params.expires / 1000),
      ObjectSizeMin: params.objectSizeMin,
      ObjectSizeMax: params.objectSizeMax,
      MimeLimit: params.mimeLimit,
      OverWrite: params.overwrite
    }

    if (putPolicyObject.MimeLimit && typeof putPolicyObject.MimeLimit !== 'string') {
      putPolicyObject.MimeLimit = putPolicyObject.MimeLimit.join(';')
    }

    const putPolicyString = JSON.stringify(putPolicyObject)
    const putPolicy = Buffer.from(putPolicyString, 'utf8').toString('base64')

    const ciper = createHmac('sha256', this.options.accessSecret)
    ciper.update(putPolicy, 'utf8')
    const sign = ciper.digest('base64')

    return {
      putPolicy,
      sign
    }
  }

  /**
   * 创建上传凭证字符串，对 `createToken` 的简单包装，直接返回 accessKey:sign:putPolicy 字符串
   * @param params
   */
  createTokenString(params: CreateTokenParams): string {
    const { putPolicy, sign } = this.createToken(params)
    return `${this.options.accessKey}:${sign}:${putPolicy}`
  }
}
