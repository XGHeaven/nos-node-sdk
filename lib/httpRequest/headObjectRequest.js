/**
 * Created by hzlichaolin on 2016/7/14.
 * this module get object's meta datas
 */
var xml2js = require('xml2js');
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var encoder = require('../services/urlEncoder');
var utils = require('../services/utils');
var fs = require('fs');

function headObjectRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'HEAD', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };
    this.bucketName = null;
    this.objectName = null;

    this.ifModifiedSince = null;
}

inherits(headObjectRequest,httpRequest);

headObjectRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

headObjectRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

headObjectRequest.prototype.setIfModifiedSince = function (ifModifiedSince) {
    this.ifModifiedSince = ifModifiedSince;
}

headObjectRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    this.options.path = '/' + this.objectName;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName;
    this.options.headers['Date'] = (new Date()).toUTCString();
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }
    if (this.ifModifiedSince != null){
        this.options.headers['If-Modified-Since'] = this.ifModifiedSince;
    }
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,
        this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;

    var responseFunc = function (res) {

        if (!utils.isOK(res.statusCode)){
            var errMessage = {
                statusCode:res.statusCode
            };

            errMessage = JSON.stringify(errMessage);
            // throw new Error(errMessage);
            func(new Error(errMessage));
        }else {
            var result = {};
            result['statusCode'] = res.statusCode;
            if (res.headers.etag != null){
                res.headers.etag = res.headers.etag.replaceAll("\"","");
            }
            result['headers'] = res.headers;
            func(null, result);
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

module.exports = headObjectRequest;