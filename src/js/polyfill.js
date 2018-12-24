if (!Array.prototype.filter) {
  Array.prototype.filter = function(fun /* , thisArg*/ ) {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var res = [];
    var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
    for (var i = 0; i < len; i++) {
      if (i in t) {
        var val = t[i];
        if (fun.call(thisArg, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}


if (!Array.prototype.forEach) {

  Array.prototype.forEach = function(callback, thisArg) {

    var T, k;

    if (this == null) {
      throw new TypeError(' this is null or not defined');
    }
    var O = Object(this);
    var len = O.length >>> 0;
    if (typeof callback !== "function") {
      throw new TypeError(callback + ' is not a function');
    }

    if (arguments.length > 1) {
      T = thisArg;
    }

    k = 0;

    while (k < len) {

      var kValue;

      if (k in O) {
        kValue = O[k];
        callback.call(T, kValue, k, O);
      }
      k++;
    }
  };
}

function addEventListener(ele, event, fn) {
  if (ele.attachEvent) {
    ele.attachEvent('on' + event, fn);
  } else if (ele.addEventListener) {
    ele.addEventListener(event, fn, false);
  }
}

function removeEventListener(ele, event, fn) {
  if (ele.detachEvent) {
    ele.detachEvent('on' + event, fn);
  } else if (ele.removeEventListener) {
    ele.removeEventListener(event, fn, false);
  }
}