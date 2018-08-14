/**
 * Created by hzlichaolin on 2016/7/12.
 * you should create this object before getObject from nosproxy
 */
var fs = require('fs');
var xml2js = require('xml2js');
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var encoder = require('../services/urlEncoder');
var utils = require('../services/utils');

function getObjectRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'GET', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;

    this.range = null;
    this.ifModifiedSince = null;
    this.destpath = null;
}

inherits(getObjectRequest,httpRequest);

getObjectRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

getObjectRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

getObjectRequest.prototype.setRange = function (range) {
    this.range = range;
}

getObjectRequest.prototype.setIfModifiedSince = function (ifModifiedSince) {
    this.ifModifiedSince = ifModifiedSince;
}

getObjectRequest.prototype.setPath = function (destpath) {
    this.destpath = destpath || __dirname;
}

getObjectRequest.prototype.sendRequestForStream = function (func) {

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
    if (this.range != null){
        this.options.headers['Range'] = this.range;
    }
    if (this.ifModifiedSince != null){
        this.options.headers['If-Modified-Since'] = this.ifModifiedSince;
    }
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,
        this.options.headers,resource);
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
            result['stream'] = res;
            func(null, result);
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

getObjectRequest.prototype.sendRequestForFile = function (func) {

    if (!bucketValidator(this.bucketName)) {
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if (!keyValidator(this.objectName)) {
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    this.options.path = '/' + this.objectName;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName;
    this.options.headers['Date'] = (new Date()).toUTCString();
    if (this.range != null) {
        this.options.headers['Range'] = this.range;
    }
    if (this.ifModifiedSince != null) {
        this.options.headers['If-Modified-Since'] = this.ifModifiedSince;
    }
    var authStr = authrization(this.accessId, this.secretKey, this.options.method,
        this.options.headers, resource);
    this.options.headers['Authorization'] = authStr;

    var localpath = this.destpath;
    var responseFunc = function (res) {

        if (!utils.isOK(res.statusCode)) {
            res.on('data', function (body) {
                var parser = new xml2js.Parser();
                parser.parseString(body, function (err, obj) {

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
        } else {
            var result = {};
            result['statusCode'] = res.statusCode;
            if (res.headers.etag != null){
                res.headers.etag = res.headers.etag.replaceAll("\"","");
            }
            result['headers'] = res.headers;
            var writerStream = fs.createWriteStream(localpath);
            res.pipe(writerStream);
            writerStream.on('finish',function () {
                func(null, result);
            })
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}



module.exports = getObjectRequest;
