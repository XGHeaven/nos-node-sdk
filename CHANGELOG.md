# ChangeLog

### v0.2.5

- Feature
    - 添加 `createToken`/`createTokenString` 方法生成前端直传 Token
- Compatible
    - 用 `removeListener` 替代 `off` 方法，兼容旧版本 Node

### v0.2.3, v0.2.4

- 修复部分特殊字符无法上传的问题
- 添加测试用例

### v0.2.2

- 修复无法使用中文/特殊字符作为 key 的 bug
- 修复 `crypto` 模块一直提示废弃

### v0.2.1

- 修复无法提示 Promise 版本函数的问题
- 添加了部分文档
- 升级了依赖到最新版本，并解决升级后测试失败的问题

### v0.2.0

- 将所有的 List 操作的返回结果从数组变成对象，用于返回一些必要的信息

### v0.1.0

- 完成了大部分的接口开发工作
