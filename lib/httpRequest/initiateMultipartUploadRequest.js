/**
 * Created by hzlichaolin on 2016/7/15.
 * you should use this first when you begin a multipart upload
 */

var xml2js = require('xml2js');
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var utils = require('../services/utils');
var fs = require('fs');

function initiateMultipartUploadRequest() {
    httpRequest.call(this)

    this.options = {hostname: null, port: -1, path: null, method: 'POST', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null
    this.objectName = null
    this.x_nos_storage_class = null
}

inherits(initiateMultipartUploadRequest,httpRequest)

initiateMultipartUploadRequest.prototype.setCustomMetaData = function (key, value) {
    this.options.headers[key] = value
}

initiateMultipartUploadRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName
}

initiateMultipartUploadRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName)
}

initiateMultipartUploadRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    this.options.path = '/' + this.objectName + '?uploads';
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName + '?uploads';
    this.options.headers['Date'] = (new Date()).toUTCString();
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,this.options.headers,resource)
    this.options.headers['Authorization'] = authStr

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
            result['headers'] = res.headers;
            var data = '';
            res.on('data',function (chunk) {
                data += chunk;
            });
            res.on('end',function () {
                var parser = new xml2js.Parser();
                parser.parseString(data,function (err, obj) {
                    // console.log(obj);
                    var temp = {};
                    temp['bucket'] = obj['InitiateMultipartUploadResult']['Bucket'][0];
                    temp['key'] = obj['InitiateMultipartUploadResult']['Key'][0];
                    temp['upload_id'] = obj['InitiateMultipartUploadResult']['UploadId'][0];
                    result['multipart_upload_info'] = temp;
                    func(null, result);
                })
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

module.exports = initiateMultipartUploadRequest