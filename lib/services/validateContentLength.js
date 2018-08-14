/**
 * Created by hzlichaolin on 2016/8/18.
 */

var _100M = 100*1024*1024;

var validator = function (buff) {
    if(buff.length > _100M){
        return false;
    }
    return true;
}

module.exports = validator;
