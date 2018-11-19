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

## 设计哲学

在设计 API 的时候，遵循了一些设计原则。

- **Keep it Simple** 一切都是那么直观，体现在接口上面就是见名明意。比如 getObject 就是获取对象内容，返回值便是 Buffer/string/Stream，而不是类似于 `{err: Error, data: xxx}` 的结构，你只是想得到内容体，为何要返回这么多数据。Believe me, It's a Trouble.
- **Arguments Bus** 参数总线或者参数公交。将参数都整合在一个对象中传递给函数，而不是散落在函数的参数中。这样有力于在后面版本的迭代中，保证接口的兼容性。例如 `getObject({objectKey: 'key', bucket: 'bucket'})` 而不是 `getObject('key', 'bucket', options)`
- **Throw as Possible** 如果有错误，能抛出就抛出，而不是内部转化，然后包装成返回参数。例如 `deleteObject(params).then(() => console.log('success')).catch(() => console.log('error'))` 而不是 `deleteObject(params).then(success => console.log(success))`

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
  objectKey: 'test-file.txt',
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
  // ret 包括 items(元素)，limit(请求的数量)，nextMarker(下一个标记)
  // 通过 limit 和 nextMarker 的配合，可以实现分页的效果
})
```

更多信息，请查看 [API 文档](http://nos-node-sdk.xgheaven.com)(Typedoc generated).

## TODO

- [ ] HTTPS Endpoint 支持
- [x] [文档支持](http://nos-node-sdk.xgheaven.com)
- [ ] 增加测试用例
- [x] ~~国际化翻译~~ 觉得也没歪果仁会用

## Coverage

```
----------------------|----------|----------|----------|----------|-------------------|
File                  |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
----------------------|----------|----------|----------|----------|-------------------|
All files             |    91.81 |    78.16 |    88.24 |    92.84 |                   |
 src                  |       98 |    94.12 |      100 |       98 |                   |
  client.ts           |       98 |    94.12 |      100 |       98 |               143 |
 src/exts             |    91.63 |    67.03 |    93.94 |    91.57 |                   |
  bucket.ts           |    88.68 |    64.29 |     87.5 |    88.46 | 62,79,80,82,83,85 |
  multipart-upload.ts |    91.82 |    59.26 |    92.86 |    91.82 |... 74,276,277,278 |
  object.ts           |    93.18 |       72 |      100 |     93.1 |... 82,233,234,236 |
 src/lib              |    89.88 |    86.67 |     81.4 |     92.9 |                   |
  authorization.ts    |      100 |    83.33 |      100 |      100 |                29 |
  constant.ts         |      100 |      100 |      100 |      100 |                   |
  error.ts            |      100 |       80 |      100 |      100 |                 3 |
  request.ts          |    56.25 |      100 |       25 |    56.25 |  6,7,8,9,21,23,27 |
  resource.ts         |    94.12 |    81.25 |      100 |      100 |          14,44,59 |
  util.ts             |     90.7 |    94.44 |    82.14 |    94.67 |      23,24,25,118 |
 src/type             |      100 |      100 |      100 |      100 |                   |
  bucket.ts           |      100 |      100 |      100 |      100 |                   |
----------------------|----------|----------|----------|----------|-------------------|
```

## Thanks

项目还比较年轻，如果有任何考虑不周的地方欢迎大家进行反馈，我也会积极处理。
争取有一天能够替代原先的 SDK，减轻大家使用上的烦恼。

[CHANGELOG](./CHANGELOG.md)

> 虽然不认为很多人都知道 NOS，哈哈哈
