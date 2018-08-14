/**
 * Created by hzlichaolin on 2016/7/13.
 * you can delete more than one object through this object
 */
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var xml2js = require('xml2js');
var crypto = require('crypto');
var utils = require('../services/utils');
var fs = require('fs');

function deleteMultipleObjectsRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'POST', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectArray = null;

    this.createRequestBody = function () {
        var json = {
            Quiet:'False',
            Object:this.objectArray
        };

        var b = new xml2js.Builder();
        var xml = b.buildObject(json);
        xml = xml.replace('<root>','<Delete>').replace('</root>','</Delete>');
        // console.log(xml)
        return xml;
    }
}

inherits(deleteMultipleObjectsRequest,httpRequest);

deleteMultipleObjectsRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName
};

deleteMultipleObjectsRequest.prototype.setObjectArray = function (objectArray) {
    this.objectArray = objectArray
};

deleteMultipleObjectsRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    this.options.path = '/?delete';
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/?delete';
    this.options.headers['Date'] = (new Date()).toUTCString();
    if(this.protocol === "https" && this.caPath !== null){
        this.options.ca = [fs.readFileSync(this.caPath)];
    }
    this.options.body = new Buffer(this.createRequestBody().toString());
    this.options.headers['Content-Length'] = this.options.body.length;
    this.options.headers['Content-MD5'] = crypto.createHash('md5').update(this.options.body).digest('hex');
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,this.options.headers,resource);
    this.options.headers['Authorization'] = authStr;
    var responseFunc = function (res) {

        if (!utils.isOK(res.statusCode)){
            //输出异常信息
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
            //返回200时的处理逻辑
            var result = {};
            result['statusCode'] = res.statusCode;
            result['headers'] = res.headers;

            res.on('data',function (body) {
                var parser = new xml2js.Parser();
                parser.parseString(body,function (err, obj) {

                    var deletedArr = obj['DeleteResult']['Deleted'] || [];
                    result['deleteSuccess'] = [];
                    for (var i=0;i<deletedArr.length;i++){
                        result['deleteSuccess'][i] = deletedArr[i]['Key'][0];
                    }

                    var errArr = obj['DeleteResult']['Error'] || [];
                    result['deleteFail'] = [];
                    for (var i=0;i<errArr.length;i++){
                        var temp = {};
                        temp['Key'] = errArr[i]['Key'][0];
                        temp['Message'] = errArr[i]['Message'][0];
                        result['deleteFail'][i] = temp;
                    }
                    func(null, result);
                });
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
};



module.exports = deleteMultipleObjectsRequest;
