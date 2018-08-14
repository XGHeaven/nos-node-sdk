/**
 * Created by hzlichaolin on 2016/7/14.
 * this module list more than one objects from a bucket
 */

var xml2js = require('xml2js');
var fs = require('fs');
var https = require('https');
var httpRequest = require('./httpRequest');
var inherits = require('./inherits');
var authrization = require('../services/authorization');
var querystring = require('querystring');
var encoder = require('../services/urlEncoder');
var bucketValidator = require('../services/validateBucketName');
var keyValidator = require('../services/validateKey');
var utils = require('../services/utils');

function listObjectsRequest() {
    httpRequest.call(this);

    this.options = {hostname: null, port: -1, path: null, method: 'GET', headers:{},
        rejectUnauthorized: true,
        ca: null,
        agent: false
    };

    this.bucketName = null;
    this.delimiter = null;
    this.marker = null;
    this.max_keys = null;
    this.prefix = null;
}

inherits(listObjectsRequest,httpRequest);

listObjectsRequest.prototype.setBucketName = function (bucketName) {
    this.bucketName = bucketName;
}

listObjectsRequest.prototype.setDelimiter = function (delimiter) {
    this.delimiter = delimiter;
}

listObjectsRequest.prototype.setMarker = function (marker) {
    this.marker = marker;
}

listObjectsRequest.prototype.setMaxKeys = function (max_keys) {
    this.max_keys = max_keys;
}

listObjectsRequest.prototype.setPrefix = function (prefix) {
    this.prefix = prefix;
}

listObjectsRequest.prototype.sendRequest = function (func) {

    if (!bucketValidator(this.bucketName)){
        // throw new Error('invalid bucket name');
        func(new Error('invalid bucket name'));
    }

    var para = {};
    if (this.delimiter != null){
        para['delimiter'] = this.delimiter;
    }
    if (this.marker != null){
        para['marker'] = this.marker;
    }
    if (this.max_keys != null){
        para['max-keys'] = this.max_keys;
    }
    if (this.prefix != null){
        para['prefix'] = this.prefix;
    }
    var query = querystring.stringify(para);

    if (query.length > 0){
        query = '?'+query;
    }

    this.options.path = '/' + query;
    this.options.hostname = this.bucketName + '.' + this.options.hostname;
    var resource = '/' + this.bucketName + '/';
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
                    result['bucketInfo'] = {};
                    result['bucketInfo']['name'] = obj['ListBucketResult']['Name'][0];
                    result['bucketInfo']['prefix'] = obj['ListBucketResult']['Prefix'][0];
                    result['bucketInfo']['marker'] = obj['ListBucketResult']['Marker'][0];
                    result['bucketInfo']['maxKeys'] = obj['ListBucketResult']['MaxKeys'][0];
                    result['bucketInfo']['is_truncated'] = obj['ListBucketResult']['IsTruncated'][0];
                    result['bucketInfo']['objectlist'] = [];
                    var contents = obj['ListBucketResult']['Contents'] || [];
                    for (var i=0;i<contents.length;i++){
                        var temp = {};
                        temp['key'] = contents[i]['Key'][0];
                        temp['etag'] = contents[i]['ETag'][0].replaceAll("\"","");
                        temp['lastmodified'] = contents[i]['LastModified'][0];
                        temp['size'] = contents[i]['Size'][0];
                        temp['storageclass'] = contents[i]['StorageClass'][0];
                        result.bucketInfo.objectlist[i] = temp;
                    }
                    func(null, result);
                });
            });
        }
    };

    httpRequest.prototype.setProtocol(this.protocol);
    httpRequest.prototype.sendRequest(this.options,responseFunc);
}

module.exports = listObjectsRequest;