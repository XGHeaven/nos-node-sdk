/**
 * Created by hzlichaolin on 2016/7/14.
 * this module can upload a file or string or json
 */

var fs = require('fs');
var xml2js = require('xml2js');
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var crypto = require('crypto');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var lengthValidator = require('../services/validateContentLength');
var utils = require('../services/utils');

function putObjectRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'PUT', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;
    this.body = null;
    this.contentLength = null;
    this.filepath = null;
}

inherits(putObjectRequest,httpRequest);

putObjectRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

putObjectRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

putObjectRequest.prototype.setCustomMetaData = function (key, value) {
    this.options.headers[key] = value;
}

putObjectRequest.prototype.setBody = function (body) {
    this.body = body;
}

putObjectRequest.prototype.setPath = function (filepath) {
    this.filepath = filepath;
}

putObjectRequest.prototype.setContentLength = function (length) {
    this.contentLength = length;
}

putObjectRequest.prototype.sendRequestStream = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    if (this.contentLength == null){
        // throw new Error('no content length');
        func(new Error('no content length'));
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
            if (res.headers.etag != null){
                res.headers.etag = res.headers.etag.replaceAll("\"","");
            }
            result['headers'] = res.headers;
            func(null, result);
        }
    };

    this.options.path = '/' + this.objectName;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName;
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
    if (this.contentLength != null){
        this.options.headers['Content-Length'] = this.contentLength;
    }

    this.options.headers['Date'] = (new Date()).toUTCString();
    this.options.body = this.body;
    var authStr = authrization(this.accessId,this.secretKey,
        this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);

};

putObjectRequest.prototype.sendRequestFile = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
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
            if (res.headers.etag != null){
                res.headers.etag = res.headers.etag.replaceAll("\"","");
            }
            result['headers'] = res.headers;
            func(null, result);
        }
    };

    this.options.path = '/' + this.objectName;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/' + this.objectName;
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
    this.options.headers['Date'] = (new Date()).toUTCString();

    var readerStream = fs.createReadStream(this.filepath);
    var fileStat =  fs.statSync(this.filepath);

    this.options.body = readerStream;
    this.options.headers['Content-Length'] = fileStat.size;
    var authStr = authrization(this.accessId,this.secretKey,
        this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);

};

module.exports = putObjectRequest;


