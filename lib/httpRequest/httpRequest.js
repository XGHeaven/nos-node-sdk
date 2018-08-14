/**
 * Created by hzlichaolin on 2016/7/12.
 */
var https = require('https');
var http = require('http');
var util = require('util');
var fs = require('fs');

function httpRequest() {
    this.accessId = null;
    this.secretKey = null;
    this.protocol = null;
    this.caPath = null;
    this.contentMD5 = null;
    this.contentType = null;
    this.expires = null;
    this.disposition = null;
    this.contentEncoding = null;
    this.cacheControl = null;
    this.contentLanguage = null;
}


httpRequest.prototype.setHost = function (host) {
    this.options.hostname = host;
};

httpRequest.prototype.setPort = function (port) {
    this.options.port = port;
};

httpRequest.prototype.setAccessId = function (accessId) {
    this.accessId = accessId;
};

httpRequest.prototype.setSecretKey = function (secretKey) {
    this.secretKey = secretKey;
};

httpRequest.prototype.setProtocol = function (protocol) {
    this.protocol = protocol;
}

httpRequest.prototype.setCaPath = function (caPath) {
    this.caPath = caPath;
}

httpRequest.prototype.setContentMD5 = function (contentMD5) {
    this.contentMD5 = contentMD5;
};

httpRequest.prototype.setContentType = function (contentType) {
    this.contentType = contentType;
};

httpRequest.prototype.setExpires = function (expires) {
    this.expires = expires;
};

httpRequest.prototype.setDisposition = function (disposition) {
    this.disposition = disposition;
};

httpRequest.prototype.setEncoding = function (encoding) {
    this.contentEncoding = encoding;
};

httpRequest.prototype.setCacheControl = function (cacheControl) {
    this.cacheControl = cacheControl;
};

httpRequest.prototype.setLanguage = function (language) {
    this.contentLanguage = language;
};

httpRequest.prototype.sendRequest = function (options,func) {
    options.headers['User-Agent'] = 'nos-node.js-sdk version=0.0.1';
    if(this.protocol == "https")
        var req = https.request(options, func);
    else if (this.protocol == "http" || this.protocol == null || this.protocol == undefined)
        var req = http.request(options, func);
    else
        // throw new Error("Endpoint not supported this protocal");
        func(new Error("Endpoint not supported this protocal"));

    req.on('error', function(err){
        util.log('REQUEST ERROR: ' + err);
    });
    if (options.body != null){
        if (options.method == 'PUT'){
            options.body.pipe(req);
        }else{
            req.write(options.body ,'binary')
            req.end();
        }
    }else {
        req.end();
    }
}

module.exports = httpRequest;