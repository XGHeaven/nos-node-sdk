/**
 * Created by hzlichaolin on 2016/7/15.
 * this module show multipart upload situation
 */

var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var querystring = require('querystring');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var xml2js = require('xml2js');
var utils = require('../services/utils');
var fs = require('fs');

function listPartsRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'GET', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.objectName = null;
    this.uploadId = null;
    this.max_parts = null;
    this.part_number_marker = null;
}

inherits(listPartsRequest,httpRequest);

listPartsRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

listPartsRequest.prototype.setObjectName = function (objectName) {
    this.objectName = encoder(objectName);
}

listPartsRequest.prototype.setUploadId = function (uploadId) {
    this.uploadId = uploadId;
}

listPartsRequest.prototype.setMaxParts = function (maxParts) {
    this.max_parts = maxParts;
}

listPartsRequest.prototype.setPartNumberMarker = function (partNumberMarker) {
    this.part_number_marker = partNumberMarker;
}

listPartsRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    if(!keyValidator(this.objectName)){
        // throw new Error('invalid object name');
        func(new Error('invalid object name'));
    }

    var para = {};
    if (this.uploadId != null){
        para['uploadId'] = this.uploadId;
    }
    if (this.max_parts != null){
        para['max-parts'] = this.max_parts;
    }
    if (this.part_number_marker != null){
        para['part-number-marker	'] = this.part_number_marker;
    }
    var query = querystring.stringify(para);

    if (query.length > 0){
        query = '?'+query;
    }

    var resource = '/' + this.bucketName + '/' + this.objectName + '?uploadId=' + this.uploadId;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    this.options.path = '/' +this.objectName + query;
    this.options.headers['Date'] = (new Date()).toUTCString();
    var authStr = authrization(this.accessId,this.secretKey,this.options.method,this.options.headers,resource);
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
            var data = '';
            res.on('data',function (chunk) {
                data += chunk;
            });
            res.on('end',function () {
                var parser = new xml2js.Parser();
                parser.parseString(data,function (err, obj) {
                    var temp = {};
                    temp['bucket'] = obj['ListPartsResult']['Bucket'][0];
                    temp['is_truncated'] = obj['ListPartsResult']['IsTruncated'][0];
                    temp['key'] = obj['ListPartsResult']['Key'][0];
                    temp['max_parts'] = obj['ListPartsResult']['MaxParts'][0];
                    temp['next_part_number_marker'] = obj['ListPartsResult']['NextPartNumberMarker'][0];

                    var owner = {};
                    owner['productid'] = obj['ListPartsResult']['Owner'][0]['ID'][0];
                    temp['owner'] = owner;

                    temp['part_number_marker'] = obj['ListPartsResult']['PartNumberMarker'][0];
                    temp['storageclass'] = obj['ListPartsResult']['StorageClass'][0];
                    temp['upload_id'] = obj['ListPartsResult']['UploadId'][0];

                    var parts = obj['ListPartsResult']['Part'] || [];
                    var part_list = [];
                    for (var i=0;i<parts.length;i++){
                        part_list[i] = {};
                        part_list[i]['etag'] = parts[i]['ETag'][0].replaceAll("\"","");
                        part_list[i]['last_modified'] = parts[i]['LastModified'][0];
                        part_list[i]['part_number'] = parts[i]['PartNumber'][0];
                        part_list[i]['size'] = parts[i]['Size'][0];
                    }
                    temp['part_list'] = part_list;

                    result['list_parts_info'] = temp;
                    func(null, result);
                });
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

module.exports = listPartsRequest;
