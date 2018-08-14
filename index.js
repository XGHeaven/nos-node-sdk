/**
 * Created by hzlichaolin on 2016/7/12.
 * this module define the operation that users can do
 */
var getObjectRequest = require('./lib/httpRequest/getObjectRequest');
var deleteObjectRequest = require('./lib/httpRequest/deleteObjectRequest');
var deleteMultipleObjectsRequest = require('./lib/httpRequest/deleteMultipleObjectsRequest');
var headObjectRequest = require('./lib/httpRequest/headObjectRequest');
var listObjectsRequest = require('./lib/httpRequest/listObjectsRequest');
var putObjectRequest = require('./lib/httpRequest/putObjectRequest');
var putObjectMoveRequest = require('./lib/httpRequest/putObjectMoveRequest');
var putObjectCopyRequest = require('./lib/httpRequest/putObjectCopyRequest');
var initiateMultipartUploadRequest = require('./lib/httpRequest/initiateMultipartUploadRequest');
var uploadPartRequest = require('./lib/httpRequest/uploadPartRequest');
var abortUploadPartRequest = require('./lib/httpRequest/abortMultipartUpload');
var listPartsRequest = require('./lib/httpRequest/listPartsRequest');
var completeMultipartUploadRequest = require('./lib/httpRequest/completeMultipartUploadRequest');
var listMultipartUploadRequest = require('./lib/httpRequest/listMultipartUploadRequest');
var fs = require('fs');

NOSClient = function (endpoint, port, accessId, secretKey, protocol, caPath) {
    this.endpoint = endpoint || null;
    this.port = port || null;
    this.secretKey = secretKey || null;
    this.accessId = accessId || null;
    this.protocol = protocol || null;
    this.caPath = caPath || null;
}

NOSClient.prototype.setEndpoint = function (endpoint) {
    this.endpoint = endpoint;
}

NOSClient.prototype.setPort = function (port) {
    this.port = port;
}

NOSClient.prototype.setAccessId = function (accessId) {
    this.accessId = accessId
}

NOSClient.prototype.setSecretKey = function (secretKey) {
    this.secretKey = secretKey
}

NOSClient.prototype.setProtocol = function (protocol) {
    this.protocol = protocol;
}

NOSClient.prototype.setCaPath = function (caPath) {
    this.caPath = caPath;
}

NOSClient.prototype.abort_multipart_upload = function (map,func) {
    var request =  new abortUploadPartRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setUploadId(map['upload_id']);
    request.sendRequest(func);
};

NOSClient.prototype.complete_multipart_upload = function (map,func) {
    var request = new completeMultipartUploadRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setUploadId(map['upload_id']);
    request.setPartArray(map['info']);
    request.setObjectMD5(map['object_md5']);
    request.setExpires(map.expires);
    request.setDisposition(map.disposition);
    request.setContentType(map.contentType);
    request.setEncoding(map.encoding);
    request.setCacheControl(map.cacheControl);
    request.setLanguage(map.language);
    request.setContentMD5(map.contentMD5);
    request.sendRequest(func);
}

NOSClient.prototype.delete_objects = function (map,func) {
    var request = new deleteMultipleObjectsRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectArray(map['keys'])
    request.sendRequest(func)
}

NOSClient.prototype.delete_object = function (map,func) {
    var request = new deleteObjectRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectName(map['key'])
    request.sendRequest(func)
}

NOSClient.prototype.get_object_stream = function (map,func) {
    var request = new getObjectRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectName(map['key'])
    request.setRange(map['range'])
    request.setIfModifiedSince(map['if_modified_since'])
    request.sendRequestForStream(func)
}

NOSClient.prototype.get_object_file = function (map,func) {
    var request = new getObjectRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setRange(map['range']);
    request.setIfModifiedSince(map['if_modified_since']);
    request.setPath(map['path']);
    request.sendRequestForFile(func);
}

NOSClient.prototype.head_object = function (map,func) {
    var request = new headObjectRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectName(map['key'])
    request.setIfModifiedSince(map['if_modified_since'])
    request.sendRequest(func)
}

NOSClient.prototype.create_multipart_upload = function (map,func) {
    var request = new initiateMultipartUploadRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectName(map['key'])
    if (map['meta_data'] != null){
        for (var key in map['meta_data']){
            request.setCustomMetaData(key,map['meta_data'][key])
        }
    }
    request.sendRequest(func)
}

NOSClient.prototype.list_multipart_upload = function (map,func) {
    var request = new listMultipartUploadRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setMaxUploads(map['limit'])
    request.setKeyMarker(map['key_marker'])
    request.sendRequest(func)
}

NOSClient.prototype.list_objects = function (map,func) {
    var request = new listObjectsRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setDelimiter(map['delimiter'])
    request.setMarker(map['marker'])
    request.setMaxKeys(map['limit'])
    request.setPrefix(map['prefix'])
    request.sendRequest(func)
}

NOSClient.prototype.list_parts = function (map,func) {
    var request = new listPartsRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket'])
    request.setObjectName(map['key'])
    request.setMaxParts(map['limit'])
    request.setPartNumberMarker(map['part_number_marker'])
    request.setUploadId(map['upload_id'])
    request.sendRequest(func)
}

NOSClient.prototype.copy_object = function (map,func) {
    var request = new putObjectCopyRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setSourceBucketName(map['src_bucket'])
    request.setSourceObjectName(map['src_key'])
    request.setDestBucketName(map['dest_bucket'])
    request.setDestObjectName(map['dest_key'])
    request.sendRequest(func)
}

NOSClient.prototype.move_object = function (map,func) {
    var request = new putObjectMoveRequest()
    request.setHost(this.endpoint)
    request.setPort(this.port)
    request.setAccessId(this.accessId)
    request.setSecretKey(this.secretKey)
    request.setProtocol(this.protocol)
    request.setCaPath(this.caPath);
    request.setSourceBucketName(map['src_bucket'])
    request.setSourceObjectName(map['src_key'])
    request.setDestBucketName(map['dest_bucket'])
    request.setDestObjectName(map['dest_key'])
    request.sendRequest(func)
}

NOSClient.prototype.put_object_stream = function (map,func) {
    var request = new putObjectRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setBody(map['body']);
    request.setContentLength(map.length);
    request.setExpires(map.expires);
    request.setDisposition(map.disposition);
    request.setContentType(map.contentType);
    request.setEncoding(map.encoding);
    request.setCacheControl(map.cacheControl);
    request.setLanguage(map.language);
    request.setContentMD5(map.contentMD5);
    if (map['meta_data'] != null){
        for (var key in map['meta_data']){
            request.setCustomMetaData(key,map['meta_data'][key]);
        }
    }
    request.sendRequestStream(func);
}

NOSClient.prototype.put_file = function (map,func) {
    var request = new putObjectRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setPath(map['filepath']);
    request.setExpires(map.expires);
    request.setDisposition(map.disposition);
    request.setContentType(map.contentType);
    request.setEncoding(map.encoding);
    request.setCacheControl(map.cacheControl);
    request.setLanguage(map.language);
    request.setContentMD5(map.contentMD5);
    if (map['meta_data'] != null){
        for (var key in map['meta_data']){
            request.setCustomMetaData(key,map['meta_data'][key]);
        }
    }
    request.sendRequestFile(func);
}

NOSClient.prototype.put_big_file = function (map, func) {
    var filepath = map.filepath;
    var fileStat =  fs.statSync(filepath);
    var total_length = fileStat.size;
    var nosclient = this;
    var _100M = 100*1024*1024;
    var start = 0;
    var end = _100M - 1;
    var complete_info = [];
    var fad_count = 0;
    var count = 0;
    var upload_id = null;
    var Q = require('q');
    var defer = Q.defer();
    var partnum = (total_length%_100M == 0) ? (total_length/_100M) : Math.floor(total_length/_100M )+1;

    nosclient.create_multipart_upload(map,function (err, result) {
        if(err) {
            func(err);
        }
        upload_id = result.multipart_upload_info.upload_id;
        var send10Parts = function () {
            for (var i=0;i<10;i++){
                if (start >= total_length){
                    break;
                }
                if (end>=total_length){
                    end = total_length-1;
                }
                var readStream = fs.createReadStream(filepath,{start:start,end:end});
                nosclient.upload_part({bucket:map.bucket,key:map.key,part_num:++fad_count,
                    upload_id:upload_id,body:readStream,length:end-start+1},function (err, result) {
                        if(err) {
                            func(err);
                        }
                    complete_info[result.partNumber-1] = {PartNumber:result.partNumber,ETag:result.headers.etag};
                    count++;

                    if (count %10 == 0){
                        if (start < total_length){
                            defer.promise.then(function (fulfilled) {
                                send10Parts();
                            })
                            defer.resolve();
                        }
                    }

                    if (count == partnum){
                        nosclient.complete_multipart_upload({bucket:map.bucket,key:map.key,expires:map.expires
                            ,disposition:map.disposition,contentType:map.contentType,encoding:map.encoding,
                            cacheControl:map.cacheControl,language:map.language,contentMD5:map.contentMD5,
                            upload_id:upload_id, object_md5:map.object_md5,info:complete_info},func);
                    }
                });
                start = end + 1;
                end = end + _100M;
            }
        }
        defer.promise.then(function (fulfilled) {
            send10Parts();
        });
        defer.resolve();
    })
}

NOSClient.prototype.upload_part = function (map,func) {
    var request = new uploadPartRequest();
    request.setHost(this.endpoint);
    request.setPort(this.port);
    request.setAccessId(this.accessId);
    request.setSecretKey(this.secretKey);
    request.setProtocol(this.protocol);
    request.setCaPath(this.caPath);
    request.setBucketName(map['bucket']);
    request.setObjectName(map['key']);
    request.setBody(map['body']);
    request.setPartNumber(map['part_num']);
    request.setUploadId(map['upload_id']);
    request.setContentLength(map.length);
    request.sendRequest(func);
}

module.exports = NOSClient;

