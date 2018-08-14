/**
 * Created by hzlichaolin on 2016/7/12.
 * this module calculate the authorization
 */
var crypto = require('crypto')

function authorization(accessId, secretKey, verb, headers,resource) {
    var contentMD5 = ''
    if (headers['Content-MD5'] != null){
        contentMD5 = headers['Content-MD5']
    }
    var contentType = ''
    if (headers['Content-Type'] != null){
        contentType = headers['Content-Type']
    }
    var message = verb + '\n' + contentMD5 + '\n' + contentType + '\n' + headers['Date'] + '\n' + canonicalizedHeaders(headers) + canonicalizedResource(resource)
    var secretMessage = crypto.createHmac('SHA256', secretKey.toString()).update(message.toString()).digest('base64')
    var authorizationStr = "NOS " + accessId + ':' + secretMessage
    return authorizationStr
}

function canonicalizedHeaders(headers) {
    var keys = new Array()
    var values = new Array()
    var stringArray = new Array()
    var result = ""
    for (header in headers){
        if (header.indexOf("x-nos-") !== 0){
            continue;
        }
        var i
        for (i = 0 ; i<keys.length ; i++){
            if(header.toLowerCase() === keys[i]){
                values[i] = values[i] + ',' + headers[keys[i]]
                break
            }
        }
        if (i === keys.length){
            values[i] = headers[header]
            keys[i] = header.toLowerCase()
        }
    }
    for (var i = 0 ; i<keys.length ; i++){
        stringArray[i] = keys[i] + ':' + values[i]
    }
    stringArray.sort()
    for (var i = 0 ; i<keys.length ; i++){
        result = result + stringArray[i]
        result = result + "\n"
    }
    return result;
}

function canonicalizedResource(resource) {
    var result = ""
    return result + resource
}

module.exports = authorization