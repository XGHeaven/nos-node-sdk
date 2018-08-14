/**
 * Created by hzlichaolin on 2016/7/15.
 * this module let you upload a part of a big object
 */
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var crypto = require('crypto');
var querystring = require('querystring');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var lengthValidator = require('../services/validateContentLength');
var xml2js = require('xml2js');
var fs = require('fs');
var utils = require('../services/utils');
var _16k = 16*1024;

function uploadPartRequest() {
    httpRequest.call(this)

    this.options = {hostname: null, port: -1, path: null, method: 'PUT', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.contentLength = null;
    this.bucketName = null
    this.objectName = null
    this.partNumber = null
    this.uploadId = null
    this.expect = null
    this.body = null
}

inherits(uploadPartRequest,httpRequest)

uploadPartRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName
}

uploadPartRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName)
}

uploadPartRequest.prototype.setPartNumber = function (partNumber) {
    this.partNumber = partNumber
}

uploadPartRequest.prototype.setUploadId = function (uploadId) {
    this.uploadId = uploadId
}

uploadPartRequest.prototype.setBody = function (body) {
    this.body = body
}

uploadPartRequest.prototype.setContentLength = function (length) {
    this.contentLength = length;
}

uploadPartRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    if (this.contentLength == null){
        // throw new Error('this part no content length');
        func(new Error('this part no content length'));
    }

    var para = {};
    if (this.partNumber != null){
        para['partNumber'] = this.partNumber;
    }
    if (this.uploadId != null){
        para['uploadId'] = this.uploadId;
    }
    var query = querystring.stringify(para);

    if (query.length > 0){
        query = '?'+query;
    }

    this.options.path = '/' + this.objectName +query;;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName +query;
    this.options.headers['Date'] = (new Date()).toUTCString();
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }

    var outer = this;

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
            result['partNumber'] = outer.partNumber;
            func(null, result);
        }
    };

    outer.options.body = this.body;
    outer.options.headers['Content-Length'] = this.contentLength;
    if (outer.expect != null){
        outer.options.headers['Expect'] = outer.expect;
    }
    var authStr = authrization(outer.accessId,outer.secretKey,
        outer.options.method,outer.options.headers,resource);
    outer.options.headers['Authorization'] = authStr;

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(outer.options,responseFunc);
};

module.exports = uploadPartRequest;
