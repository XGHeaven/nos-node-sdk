/**
 * Created by hzlichaolin on 2016/7/15.
 * this module copy a object from one bucket to another bucket
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

function putObjectCopyRequest() {
    httpRequest.call(this)

    this.options = {hostname: null, port: -1, path: null, method: 'PUT', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.destBucketName = null
    this.destObjectName = null
    this.sourceBucektName = null
    this.sourceObjectName = null

}

inherits(putObjectCopyRequest,httpRequest)

putObjectCopyRequest.prototype.setDestBucketName = function (destBucketName) {
    this.destBucketName = destBucketName
}

putObjectCopyRequest.prototype.setDestObjectName = function (destObjectName) {
    this.destObjectName = encoder(destObjectName)
}

putObjectCopyRequest.prototype.setSourceBucketName = function (sourceBucketName) {
    this.sourceBucektName = sourceBucketName
}

putObjectCopyRequest.prototype.setSourceObjectName = function (sourceObjectName) {
    this.sourceObjectName = encoder(sourceObjectName)
}

putObjectCopyRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.sourceBucektName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.sourceObjectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    if (!bucketValidator(this.destBucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.destObjectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    this.options.path = '/' + this.destObjectName;
    this.options.hostname = this.destBucketName + '.' + this.options.hostname;
    var resource = '/' + this.destBucketName + '/' + this.destObjectName;
    this.options.headers['Date'] = (new Date()).toUTCString();
    this.options.headers['x-nos-copy-source'] = '/' + this.sourceBucektName + '/' + this.sourceObjectName;
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

module.exports = putObjectCopyRequest;
