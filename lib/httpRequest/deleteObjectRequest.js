/**
 * Created by hzlichaolin on 2016/7/13.
 * this module delete the object
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

function deleteObjectRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'DELETE', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;
}

inherits(deleteObjectRequest,httpRequest);

deleteObjectRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
};

deleteObjectRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
};

deleteObjectRequest.prototype.sendRequest = function (func) {

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
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;

    var responseFunc = function (res) {

        if (!utils.isOK(res.statusCode)){
            res.on('data',function (body) {
                var parser = new xml2js.Parser();
                parser.parseString(body,function (err, obj) {
                    var errMessage = {
                        statusCode:res.statusCode,
                        errorCode:obj['Error']['Code'][0],
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
};

module.exports = deleteObjectRequest;
