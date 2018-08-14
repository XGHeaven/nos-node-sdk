/**
 * Created by hzlichaolin on 2016/7/23.
 */

module.exports = function (str) {
    var temp = encodeURIComponent(str)
    temp = temp.replaceAll("'",escape("'"))
    temp = temp.replaceAll("!",escape("!"))
    temp = temp.replaceAll("~",escape("~"))
    temp = temp.replaceAll("\\(",escape("("))
    temp = temp.replaceAll("\\)",escape(")"))
    return temp
}

String.prototype.replaceAll = function(s1,s2){
    try {
        var regex = new RegExp(s1,"gm")
    } catch(e) {
        console.log("dump")
    }
    return this.replace(regex,s2);
}
