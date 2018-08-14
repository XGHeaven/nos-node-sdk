# NOS Node.js SDK
NOS Node.js SDK实现了NOS对象操作接口，基于此SDK能方便快速地实现JavaScript应用程序来使用NOS的对象存储服务。

## 支持的功能

### 对象操作接口

* Delete Object —— 删除一个对象
* Delete Multiple Objects —— 用一个HTTP请求删除同一个Bucket中的多个对象
* Get Object —— 读取对象内容
* Head Object —— 获取对象相关元数据信息
* List Objects —— 获取一个桶的对象列表
* Put Object —— 上传一个对象
* Put Object - Copy —— 拷贝一个对象
* Put Object - Move —— 桶内部move一个对象

### 大对象分块操作接口
* Initiate Multipart Upload —— 初始化分块上传
* Upload Part —— 上传一个分块
* Complete Multipart Upload —— 完成分块上传
* Abort Multipart Upload —— 取消分块上传并删除已上传的分块
* List Parts —— 列出已上传的分块
* List Multipart Uploads —— 列出所有执行中的分块上传事件

## 使用说明

在调用对象操作接口前需要如下步骤：

1.安装nos-node-sdk-test模块 npm install nos-node-sdk-test

2.引入模块 nos-node-sdk-test 模块 var NOSClient = require('nos-node-sdk-test')

3.新建 NOSClient对象并初始化参数

    nosclient.setAccessId('您的accessKeyId');
	nosclient.setSecretKey('您的accessKeySecret');
	nosclient.setEndpoint('建桶时选择的的区域域名');
	nosclient.setPort('80');
	
	若使用https协议:
	var nosclient = new NosClient();
	nosclient.setAccessId('您的accessKeyId');
	nosclient.setSecretKey('您的accessKeySecret');
	nosclient.setEndpoint('建桶时选择的的区域域名');
	nosclient.setProtocol('https');
	nosclient.setPort('443');
	 
4.调用nosclient对象的各个方法发送不同的请求，第一个参数是map，第二个参数是一个回调函数

     nosclient.delete_object({bucket:'bucket',key:'b.txt'}，func)

关于第二个参数，即回调函数，是一个异步函数，会在接收到响应的时候回调，由用户自己定义,该函数有如下声明：

    var func = function(result){
       //用户自己的逻辑，result为响应的结构体，用户可以使用这个结构体读取statusCode，requestId等信息
       //例如map['statusCode'] 可以获取statusCode
    }
    
5.如果调用返回[200,400)，用户可以参考result中包含的信息构造回调函数，实现自己的逻辑。状态码在这个区间外，一律抛出异常，异常信息包括
状态码，requestid,错误说明，resource  
如果桶名非法，异常信息为invalid bucket name，如果对象名非法，异常信息为invalid object name

## 接口实现

### 对象操作接口

#### Delete Object

使用举例

```
var func = function(result){
       //打印statusCode
       console.log(result['statusCode']);
       //打印requestId
       console.log(result['headers']['x-nos-version-id'])
    }

nosclient.delete_object({bucket:'bucket',key:'b.txt'}，func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: {
'x-nos-request-id': 'e2f97ce70af100000155fb63f9fc15fb',
  'x-nos-version-id': '0',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```

#### Delete Multiple Objects

使用举例

```
    var func = function(result){
       //打印statusCode
       console.log(result['statusCode']);
       //打印requestId
       console.log(result['headers']['x-nos-version-id'])
       //打印所有删除成功的对象名
       var deleteSuccess = result['deleteSuccess']
       for(var i=0;i<deleteSuccess.length;i++){
            console.log(deleteSuccess[i])
       }
       //打印所有删除失败的对象名
       var deleteFail = result['deleteFail']
       for(var i=0;i<deleteFail;i++){
            console.log(deleteFail[i]['Key']);
            console.log(deleteFail[i]['Message']);
       }
    }

nosclient.delete_objects(
    {bucket:'bucket',
    keys:[{Key:'b.txt'},{Key:'c.txt'}],func)
```

参数说明

* bucket(string) -- 桶名。
* keys(array) -- 待删除的对象名称列表，是一个数组，每个元素是一个键值对

异步调用的map参数中包含的信息

```
statusCode: 200
headers: {
'x-nos-request-id': 'ab6f6cce0af100000155fb68571115fb',
  'content-type': 'application/xml; charset=UTF-8',
  'content-length': '55',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
delete-success:['1.jpg','2.jpg']
delete-fail:[{Key:'3.jpg',Message:'NoSuchBucket'},{Key:'4.jpg',Message:'AccessDenied'}]

```


#### Get Object

可以返回一个流或者下载整个文件

使用举例

```
返回一个流

    var func = function(result){
       //打印statusCode
       console.log(result['statusCode']);
       //打印requestId
       console.log(result['headers']['x-nos-version-id'])
       //获取流
       var stream = result['stream']
       //处理流
       ..........
    }

nosclient.get_object_stream({bucket:'bucket',key:'b.txt'},func)

下载整个文件到指定路径

nosclient.get_object_file({bucket:'bucket',key:'b.txt',path:'destpath'},func)
这里的destpath包括了文件名

```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* 其他可选参数，如下。
   * range(string) -- 下载指定的数据块，Range Header参考RFC2616。
   * if_modified_since(datetime) -- 指定时间，只有当指定时间之后做过修改操作才返回这个对象。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: {
'x-nos-request-id': 'aa2402d20af100000155fb6d6cd915fb',
  'content-type': 'application/octet-stream; charset=UTF-8',
  etag: '926d74ef88054b6586a5530c5c6606b3',
  'content-disposition': 'inline; filename="c.txt"',
  'last-modified': 'Mon, 18 Jul 2016 08:33:12 Asia/Shanghai',
  'cache-control': 'no-cache',
  'content-length': '18',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
stream:readablestream(如果是下载文件不包含这个)  


如果返回的状态码是304，result中包含的信息如下
statusCode:304 
headers{
server: ngx_openresty/1.4.3.6
date: Wed, 31 Aug 2016 02:38:52 GMT
content-Type: text/plain
connection: keep-alive
x-nos-request-id: 6b57bc8f0aa000000156de76a52b849b
}

```

#### Head Object

使用举例

```
var func = function(result){
       //打印statusCode
       console.log(result['statusCode']);
       //打印requestId
       console.log(result['headers']['x-nos-version-id'])
    }

nosclient.head_object({bucket:'bucket',key:'b.txt'},func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* 其他可选参数，如下。
   * if_modified_since(datetime) -- 指定时间，只有当指定时间之后做过修改操作才返回这个对象。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': '346251790af100000155fb76baac15fb',
  etag: '926d74ef88054b6586a5530c5c6606b3',
  'content-length': '18',
  'last-modified': 'Mon, 18 Jul 2016 08:33:12 Asia/Shanghai',
  'content-type': 'application/octet-stream',
  'cache-control': 'no-cache',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```

#### List Objects

使用举例

```
var func = function(result){
       //获取对象列表
       var objectlist = result['bucketInfo']['objectlist'];
       //遍历对象列表
       for(var i = 0 ; i < objectlist.length ; i++){
            //打印对象信息
            console.log(objectlist[i]['key']);
            console.log(objectlist[i]['lastmodified']);
            console.log(objectlist[i]['etag']);
            console.log(objectlist[i]['size']);
            console.log(objectlist[i]['storageclass'])
       }
    }

nosclient.list_objects({bucket:'bucket'},func)
```

参数说明

* bucket(string) -- 桶名。
* kwargs -- 其他可选参数。
    * delimiter(string) -- 分界符，用于做groupby操作。
    * marker(string) -- 字典序的起始标记，只列出该标记之后的部分。
    * limit(integer) -- 限定返回的数量，返回的结果小于或等于该值。取值范围：0-1000，默认：100
    * prefix(string) -- 只返回Key以特定前缀开头的那些对象。可以使用前缀把一个桶里面的对象分成不同的组，类似文件系统的目录一样。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': 'db9524a10af100000155fb7ab73d15fb',
  'content-type': 'application/xml; charset=UTF-8',
  'content-length': '1343',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
bucketInfo:{
  name:'bucket',
  prefix:'',
  marker:'',
  maxkeys:100,
  is_truncated:false,
  objectList:[{key:'a.txt',lastmodified:'2016-07-18T08:49:03 +0800',
  etag:'926d74ef88054b6586a5530c5c6606b3',size:18,storageclass:archive-standard},......]
  //object-list是一个数组，每个数据元素都是一个map，包含key,lastmodify,etag,size,storageclass 5项信息，代表桶里面的对象
}
```

#### Put Object

这个接口提供流式上传和提供文件路径的上传

使用举例

```
流式上传，需要指定流的长度，如果不指定则抛出异常

nosclient.put_object_stream({
           bucket:'bucket',
           key:'d.txt',
           body:readableStream,length:1135},func)

文件路径上传,不需要指定length

nosclient.put_file({
           bucket:'bucket',
           key:'d.txt',
           filepath:'path'},func)
           
文件路径上传大对象(对象最大为1T)，此接口内部调用了分块上传接口

nosclient.put_big_file({
           bucket:'bucket',
           key:'d.txt',
           filepath:'path'},func)
此接口回调函数中result参数的返回内容请参见 complete multipart upload 接口
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* body -- 对象内容，请传入一个readableStream对象
* filepath -- 对象的文件路径，绝对路径
* length -- 对象大小，对于上传一个流来说是必须的，其他两个接口不需要
* kwargs -- 其他可选参数。
    * meta_data(dict) -- 用户自定义的元数据，通过键值对的形式上报，键名和值均为字符串，且键名需以`x-nos-meta-`开头。
    * expires 缓存时间
    * disposition 浏览器打开时是否需要提示用户保存
    * contentType 对象类型
    * encoding 对象的编码
    * cacheControl 缓存控制
    * language 对象的语言
    * contentMD5 对象的MD5
    * object_md5 仅对上传大对象文件时有效，与complete_multipart_upload接口中的object_md5含义相同

异步调用的result参数中包含的信息

```
18 Jul 08:58:35 - STATUS: 200
18 Jul 08:58:35 - HEADERS: { 'x-nos-request-id': '2aa8555c0af100000155fb83034c15fb',
  etag: 'b1335fbca4c89d12719cf99fdcab707e',
  'x-nos-object-name': 'd.txt',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```


#### Put Object - Copy

使用举例

```
nosclient.copy_object({src_bucket:'bucket',
    src_key:'nimawangjiao',
    dest_bucket:'bucket2',
    dest_key:'q.txt'},func)
```

参数说明

* src_bucket(string) -- 来源对象的桶名。
* src_key(string) -- 来源对象的对象名。
* dest_bucket(string) -- 目标对象的桶名。
* dest_key(string) -- 目标对象的对象名。

异步调用的result参数中包含的信息

```
18 Jul 09:09:52 - STATUS: 200
18 Jul 09:09:52 - HEADERS: { 'x-nos-request-id': 'aa1c14690af100000155fb8d577415fb',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```

#### Move Object

使用举例

```
nosclient.move_object({
      src_bucket:'bucket2',
      src_key:'q.txt',
      dest_bucket:'bucket2',
      dest_key:'m.txt'},func)
```

参数说明

* src_bucket(string) -- 来源对象的桶名。
* src_key(string) -- 来源对象的对象名。
* dest_bucket(string) -- 目标对象的桶名。
* dest_key(string) -- 目标对象的对象名。

异步调用的result参数中包含的信息

```
18 Jul 09:13:34 - STATUS: 200
18 Jul 09:13:34 - HEADERS: {
'x-nos-request-id': '94c462780af100000155fb90a20515fb',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```

#### Initiate Multipart Upload

使用举例

```
nosclient.create_multipart_upload({
      bucket:'bucket',
      key:'d.txt',
      meta_data:{'x-nos-meta-hell':'hello'}},func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
*  其他可选参数。
    * meta_data(dict) -- 用户自定义的元数据，通过键值对的形式上报，键名和值均为字符串，且键名需以`x-nos-meta-`开头。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': 'a39843610af100000155fb949f8115fb',
  'content-type': 'application/xml; charset=UTF-8',
  'content-length': '193',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
multipart_upload_info:{
   bucket:'bucket',
   key:'d.txt',
   upload_id:4688949732940019989
}
```

#### Upload Part

使用举例

```
nosclient.upload_part({
        bucket:'bucket',
        key:'d.txt',
        part_num:1,
        upload_id:'4688949732940019989', (此处不能省略引号)
        body:readableStream,length:1235},func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* part_num(integer) -- 数据分块编码号（1-10000）。
* upload_id(string) -- 数据上传标识号。
* body -- 对象内容，传入一个readableStream
* length -- 分块大小

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': 'af253f210af100000155fb97d3ad15fb',
  etag: 'ff9360dc18c5e09a80db8f0aa115d52c',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
partNumber:1
```


#### Complete Multipart Upload
在将所有数据Part都上传完成后，必须调用Complete Multipart Upload API来完成整个文件的Multipart Upload。在执行该操作时，用户必须提供所有有效的数据Part的列表（包括part号码和ETAG）；NOS收到用户提交的Part列表后，会逐一验证每个数据Part的有效性。当所有的数据Part验证通过后，NOS将把这些数据part组合成一个完整的Object。
使用x-nos-Object-md5扩展头发送对象的MD5值，用作去重库的建立（Put Object使用Content-MD5建立对象去重库）。

使用举例

```
nosclient.complete_multipart_upload({
         bucket:'bucket',
         key:'d.txt',
         upload_id:'4688949732940019989',
         info:[{PartNumber:'1',ETag : 'dc28229fb48cc93025ce862e79c4623f'}]},func)

```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* upload_id(string) -- 数据上传标识号。
* info(list) -- 所有有效的数据Part的列表，传入的是一个数组，数组元素是一个map，map中的key-value规则如上例所示
* kwargs -- 其他可选参数，如下。
    * object_md5(string) -- 发送对象的md5值，用于后续去重。

异步调用的result参数中包含的信息

```
statusCode: 200
{ server: 'openresty/1.9.15.1',
     date: 'Mon, 05 Sep 2016 06:47:28 GMT',
     'content-type': 'application/xml;charset=UTF-8',
     'content-length': '334',
     connection: 'close',
     'x-nos-request-id': 'c980b4d80ab000000156f91a09e43f0c' },
multipart_upload_result:{
  location:filestation.nos.netease.com/movie.avi,
  bucket:filestation,
  key:movie.avi,
  etag:"3858f62230ac3c915f300c664312c11f-9"
}
```

#### Abort Multipart Upload

使用举例

```
nosclient.abort_multipart_upload({
        bucket:'bucket',
        key:'d.txt',
        upload_id:'4688949732940019989'},func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* upload_id(string) -- 数据上传标识号。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': 'f381b02c0af100000155fba0d89e15fb',
  'content-length': '0',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
```

#### List Parts

使用举例

```
nosclient.list_parts({
       bucket:'bucket',
       key:'d.txt',
       upload_id:'4688949732940019989'},func)
```

参数说明

* bucket(string) -- 桶名。
* key(string) -- 对象名。
* upload_id(string) -- 数据上传标识号。
* kwargs -- 其他可选参数，如下。
    * limit(integer) -- 限制响应中返回的记录个数。取值范围：0-1000，默认1000。
    * part_number_marker(string) -- 分块号的界限，只有更大的分块号会被列出来。

异步调用的result参数中包含的信息

```
statusCode: 200
headers: { 'x-nos-request-id': '5292fe910af100000155fba5740515fb',
  'content-type': 'application/xml; charset=UTF-8',
  'content-length': '1123',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
list_parts_info:{
  bucket:'bucket',
  key:'d.txt',
  upload_id:'4685815523730016248',
  owner:{productid:'productid'},
  storageclass:'archive-standard',
  part_number_marker:'0',
  next_part_number_marker:'4',
  max_parts:'1000',
  is_truncated:'false',
  part_list:[{part_number:1,last_modified:2016-07-15T19:20:27 +0800,etag:b33df4c9833e4dcba58e72ea0a9fcd7f,size:12}......]
  //part_list是parts的数组，数据每个元素是一个map，包含part_number,last_modified,etag,size信息
}
```

#### List Multipart Uploads

使用举例：

```
nosclient.list_multipart_upload({bucket:'bucket'},func)
```

参数说明

* bucket(string) -- 桶名。
* kwargs -- 其他可选参数，如下。
    * limit(integer) -- 限制响应中返回的记录个数。取值范围：0-1000，默认1000。
    * key_marker(string) -- 指定某一uploads key，只有大于该key-marker的才会被列出。

返回值举例

```
statusCode: 200
headers: { 'x-nos-request-id': '6213b3d00af100000155fbabcf8115fb',
  'content-type': 'application/xml; charset=UTF-8',
  'content-length': '455',
  connection: 'close',
  server: 'Jetty(6.1.11)' }
multipart_upload_result:{
  bucket:'bucket',
  next_key_marker:'4685815523730016248',
  is_truncated:'false',
  uploads:[{key:'d.txt',upload_id:'4685815523730016248',storage_class:'archive-standard',owner:{name:'name',productid:'productid'},initiated:'2016-07-15T19:19:12 +0800'}......]
  //展示每个上传信息的数组，数组的每个元素都是一个map，包含key,upload_id,storage_class,owner,initiated信息
}
```