/**
 * Created by hzlichaolin on 2016/8/30.
 */

function utils() {
}
utils.prototype.isOK = function (httpCode) {
    if (httpCode < 200 || httpCode >= 400){
        return false;
    }else {
        return true;
    }
}

module.exports = new utils();