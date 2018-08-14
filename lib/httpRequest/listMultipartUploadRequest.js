/**
 * Created by hzlichaolin on 2016/7/15.
 * this module list all the multipart upload event in a bucket
 */

var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var querystring = require('querystring');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var xml2js = require('xml2js');
var utils = require('../services/utils');
var fs = require('fs');

function listMultipartUploadRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'GET', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.keyMarker = null;
    this.maxUploads = null;
}

inherits(listMultipartUploadRequest,httpRequest);

listMultipartUploadRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

listMultipartUploadRequest.prototype.setKeyMarker = function (keyMarker) {
    this.keyMarker = keyMarker;
}

listMultipartUploadRequest.prototype.setMaxUploads = function (maxUploads) {
    this.maxUploads = maxUploads;
}

listMultipartUploadRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    var para = {};
    if (this.keyMarker != null){
        para['key-marker'] = this.keyMarker;
    }
    if (this.maxUploads != null){
        para['max-uploads'] = this.maxUploads;
    }
    var query = querystring.stringify(para);
    
    if (query.length > 0){
        query = '&' + query;
    }

    var resource = '/' + this.bucketName + '/?uploads';
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    this.options.path = '/?uploads' + query;
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
                    var temp = {};
                    temp['bucket'] = obj['ListMultipartUploadsResult']['Bucket'][0];
                    temp['is_truncated'] = obj['ListMultipartUploadsResult']['IsTruncated'][0];
                    temp['next_key_marker'] = obj['ListMultipartUploadsResult']['NextKeyMarker'][0];
                    var uploads = obj['ListMultipartUploadsResult']['Upload'] || [];
                    var upload_list = [];
                    for (var i=0;i<uploads.length;i++){
                        upload_list[i] = {};
                        upload_list[i]['key'] = uploads[i]['Key'][0];
                        upload_list[i]['upload_id'] = uploads[i]['UploadId'][0];
                        upload_list[i]['storage_class'] = uploads[i]['StorageClass'][0];
                        upload_list[i]['initiated'] = uploads[i]['Initiated'][0];
                        var owner = {};
                        owner['name'] = uploads[i]['Owner'][0]['DisplayName'][0];
                        owner['productid'] = uploads[i]['Owner'][0]['ID'][0];
                        upload_list[i]['owner'] = owner;
                    }
                    temp['uploads'] = upload_list;
                    result['multipart_upload_result'] = temp;
                    func(null, result);
                });
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
};

module.exports = listMultipartUploadRequest;
