/**
 * Created by hzlichaolin on 2016/7/15.
 * this module stop the multipart upload if it hasn't finish yet
 */

var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var xml2js = require('xml2js');
var utils = require('../services/utils');
var fs = require('fs');
var https = require('https');

function abortMultipartUpload() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'DELETE', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;
    this.uploadId = null;
}

inherits(abortMultipartUpload,httpRequest);

abortMultipartUpload.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

abortMultipartUpload.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

abortMultipartUpload.prototype.setUploadId = function (uploadId) {
    this.uploadId = uploadId;
}

abortMultipartUpload.prototype.sendRequest = function (func) {

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
    var resource = '/' + this.bucketName + '/' + this.objectName + '?uploadId=' + this.uploadId;;
    this.options.headers['Date'] = (new Date()).toUTCString();
    var authStr = authrization(this.accessId,this.secretKey,
        this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }

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
            func(null, result);
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

module.exports = abortMultipartUpload;

