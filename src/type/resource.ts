export type Resource = ResourceEmpty | ResourceBucket | ResourceObject

export interface ResourceEmpty {
}

export interface ResourceBucket {
  bucket: string
  acl?: boolean
  location?: boolean
}

export interface ResourceObject {
  bucket: string
  objectKey: string
  uploadId?: string
  uploads?: boolean
  partNumber?: number
  delete?: boolean
}
