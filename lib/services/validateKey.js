/**
 * Created by hzlichaolin on 2016/8/17.
 */

var keyValidator = function (key) {

    if (key == null){
        return false;
    }

    var buff = new Buffer(key,'utf-8');
    if (buff.length < 1 || buff.length > 1000){
        return false;
    }
    return true;
};

module.exports = keyValidator;