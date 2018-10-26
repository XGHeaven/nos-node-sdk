// 定义一些基础的请求响应类型

/**
 * List 操作的返回类型
 */
export interface ListOperationResponse<ItemType = any, NextMarkerType = string> {
  items: ItemType[]

  limit: number
  // 是否被截断，只有当还有数据的时候为真
  isTruncated: boolean

  nextMarker: NextMarkerType
}
