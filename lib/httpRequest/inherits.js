/**
 * Created by hzlichaolin on 2016/7/12.
 * this is a function that used to implement inheritation in OOP
 */

function inherits(Child, Parent) {
    var F = function () {};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
}

module.exports = inherits;
