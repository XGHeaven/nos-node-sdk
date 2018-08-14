/**
 * Created by hzlichaolin on 2016/8/15.
 */
var validator = require('validator');

var bucketValidator = function (bucket) {

    if (bucket == null){
        return false;
    }

    //长度必须在3到63字符之间
    if(bucket.length<3 || bucket.length>63){
        return false;
    }

    //必须以字母或者数字开头和结尾
    if(!isBucketAlphanumeric(bucket[0]) || !isBucketAlphanumeric(bucket[bucket.length-1])){
        return false;
    }

    //必须是小写字母，数字，点号(.)，横岗(-)组成
    for (var i=1;i<bucket.length;i++){
        if (!(isBucketAlphanumeric(bucket[i]) || bucket[i] == '-')){
            return false;
        }

        //不能包含连续的非字母数字
        if (!isBucketAlphanumeric(bucket[i-1])
            && !isBucketAlphanumeric(bucket[i])){
            return false;
        }
    }

    //不允许使用ipv4地址格式的桶
    if (isIPAdressModule(bucket)){
        return false;
    }

    return true;
};

var isBucketAlphanumeric = function (char) {
    return validator.isAlphanumeric(char) && validator.isLowercase(char);
};

var isIPAdressModule = function (bucket) {
    var arr = bucket.split('.');
    if (arr.length != 4){
        return false;
    }
    for (var i=0;i<4;i++){
        if (!validator.isInt(arr[i])){
            return false;
        }
    }
    return true;
};

module.exports = bucketValidator;