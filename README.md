# NOS Node.js SDK

NOS Node.js SDK 实现了 NOS 对象操作接口，基于此 SDK 能方便快速地实现 JavaScript 应用程序来使用 NOS 的对象存储服务。

> NOS 是网易云推出的对象存储服务，稳定可靠

## 为什么会有这个项目？

主要原因是官方的 `nos-node-sdk` 有如下问题

- 不符合 JavaScript 命名规范，不支持 Promise
- 代码质量过差
- 代码提示能力不足
- 不支持 TypeScript
- 年久失修

## Feature

- Full Typescript 支持，几乎不需要文档就可以上手
- Support Async/Await or Callback
- 操作简单专注，不会给你返回额外的信息
- 丰富的测试用例

## QuickStart

```typescript

import { NosClient } from '@xgheaven/nos-node-sdk'

const client = new NosClient({
  accessKey: 'your-access-key',
  accessSecret: 'your-access-secret',
  endpoint: 'http://nos-eastchina1.126.net', // endpoint，不同地域不同
  defaultBucket: 'nos-test', // 默认的 Bucket，如果不设置，那么需要在单独的每次请求中进行设置 
})

client.putObject({
  key: 'test-file.txt',
  body: Buffer.from('test'), // 支持 Buffer/Readable/string
}).then(() => {
  return client.getObject({
    key: 'test-file.txt',
    encode: 'utf-8', // 支持 'buffer' | 编码 | 'stream'
  })
}).then(content => {
  console.log(content)
})

client.listObject({
  limit: 10
}).then(ret => {
  console.log(ret)
  // 所有的 List 操作接口返回的数据都是类似的，比如 listObject, listBucket, listParts, listMultipart
  // 其中包括 items(元素)，limit(请求的数量)，nextMarker(下一个标记)
  // 通过 limit 和 nextMarker 的配合，可以实现翻页的效果
})
```

更多信息，请查看[API 文档](http://nos-node-sdk.xgheaven.com)(Typedoc generated).

## TODO

- [ ] HTTPS Endpoint 支持
- [x] [文档支持](http://nos-node-sdk.xgheaven.com)
- [ ] 增加测试用例
- [ ] 国际化翻译

## Thanks

项目还比较年轻，如果有任何考虑不周的地方欢迎大家进行反馈，我也会积极处理。
争取有一天能够替代原先的 SDK，减轻大家使用上的烦恼。

> 虽然不认为很多人都知道 NOS，哈哈哈
