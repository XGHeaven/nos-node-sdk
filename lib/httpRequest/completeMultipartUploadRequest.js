/**
 * Created by hzlichaolin on 2016/7/15.
 * you can finish a multipart upload when you use this module
 */

var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var xml2js = require('xml2js');
var crypto = require('crypto');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var xml2js = require('xml2js');
var utils = require('../services/utils');
var fs = require('fs');

function completeMultipartUploadRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'POST', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;
    this.objectMD5 = null;
    this.partArray = null;
    this.uploadId = null;

    this.createRequestBody = function () {
        var json = {
            '':'',
            Part:this.partArray
        };

        var b = new xml2js.Builder();
        var xml = b.buildObject(json);
        xml = xml.replace('<root>','<CompleteMultipartUpload>').replace('</root>','</CompleteMultipartUpload>').replace('</>','');
        // console.log(xml)
        return xml;
    }
}

inherits(completeMultipartUploadRequest,httpRequest);

completeMultipartUploadRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

completeMultipartUploadRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

completeMultipartUploadRequest.prototype.setObjectMD5 = function (md5) {
    this.objectMD5 = md5;
}

completeMultipartUploadRequest.prototype.setPartArray = function (partArray) {
    this.partArray = partArray;
}

completeMultipartUploadRequest.prototype.setUploadId = function (uploadId) {
    this.uploadId = uploadId;
}

completeMultipartUploadRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    this.options.path = '/' + this.objectName + '?uploadId=' + this.uploadId;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName + '?uploadId=' + this.uploadId;
    this.options.headers['Date'] = (new Date()).toUTCString();
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }
    this.options.body = new Buffer(this.createRequestBody().toString());
    this.options.headers['Content-Length'] = this.options.body.length;
    if (this.expires != null){
        this.options.headers['Expires'] = this.expires;
    }
    if (this.disposition != null){
        this.options.headers['Content-Disposition'] = this.disposition;
    }
    if (this.contentType != null){
        this.options.headers['Content-Type'] = this.contentType;
    }
    if (this.contentEncoding != null){
        this.options.headers['Content-Encoding'] = this.contentEncoding;
    }
    if (this.cacheControl != null){
        this.options.headers['Cache-Control'] = this.cacheControl;
    }
    if (this.contentLanguage != null){
        this.options.headers['Content-Language'] = this.contentLanguage;
    }
    if (this.contentMD5 != null){
        this.options.headers['Content-MD5'] = this.contentMD5;
    }else {
        this.options.headers['Content-MD5'] =
            crypto.createHash('md5').update(this.options.body).digest('hex');
    }
    if (this.objectMD5 != null){
        this.options.headers['x-nos-Object-md5'] = this.objectMD5;
    }
    var authStr = authrization(this.accessId,this.secretKey,
        this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;

    var responseFunc = function (res) {

        if (!utils.isOK(res.statusCode)){
            res.on('data',function (body) {
                var parser = new xml2js.Parser();
                parser.parseString(body,function (err, obj) {
                    var errMessage = {
                        statusCode:res.statusCode,
                        errorCode:obj['Error']['Code'][0],
                        message:obj['Error']['Message'][0],
                        requestId:obj['Error']['RequestId'][0],
                        resource:obj['Error']['Resource'[0]]
                    };

                    errMessage = JSON.stringify(errMessage);
                    // throw new Error(errMessage);
                    func(new Error(errMessage));
                });
            });
        }else {
            var result = {};
            result['statusCode'] = res.statusCode;
            if (res.headers.etag != null){
                res.headers.etag = res.headers.etag.replaceAll("\"","");
            }
            result['headers'] = res.headers;

            var data = '';
            res.on('data',function (chunk) {
                data += chunk;
            });
            res.on('end',function () {
                var parser = new xml2js.Parser();
                parser.parseString(data,function (err, obj) {
                    var temp = {};
                    temp['bucket'] = obj['CompleteMultipartUploadResult']['Bucket'][0];
                    temp['etag'] = obj['CompleteMultipartUploadResult']['ETag'][0].replaceAll("\"","");
                    temp['key'] = obj['CompleteMultipartUploadResult']['Key'][0];
                    temp['location'] = obj['CompleteMultipartUploadResult']['Location'][0];
                    result['multipart_upload_result'] = temp;
                    // func(result);
                    func(null, result);
                });
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
};

module.exports = completeMultipartUploadRequest;
