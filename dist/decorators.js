(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.decoratorsJs = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  /*
   *Common decorators and combinators I use in Javascript
   *@author Jared Smith
   *@copyright Jared Adam Smith, 2015, 2016
   *Licensed under the MIT license. You should have received a copy with this software, otherwise see
   *https://opensource.org/licenses/MIT.
   *
   */

  // Extracts internal [[class]] property of a javascript value
  // _extractHiddenClass :: * -> String
  var _extractHiddenClass = function (r) {
    return function (a) {
      return Object.prototype.toString.call(a).match(r)[1];
    };
  }(/ ([a-z]+)]$/i);

  var _applyConstructor = function _applyConstructor(ctor, args) {
    return new (ctor.bind.apply(ctor, [ctor].concat(_toConsumableArray(args))))();
  };

  // NOTE: the 'this' context will be determined at the time the curried function receives its
  // **final** argument.
  var curry = function curry(len, f) {
    for (var _len = arguments.length, initArgs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      initArgs[_key - 2] = arguments[_key];
    }

    var _ref = function () {
      switch (true) {
        case _extractHiddenClass(len) === 'Function':
          var args = f == null ? [] : [f].concat(initArgs);
          return [len, len.length, args];
        case _extractHiddenClass(len) === 'Number':
          return [f, len, initArgs];
        default:
          throw new TypeError('Unrecognized arguments ' + len + ' and ' + f + ' to function curry.');
      }
    }(),
        _ref2 = _slicedToArray(_ref, 3),
        fn = _ref2[0],
        arity = _ref2[1],
        fnArgs = _ref2[2];

    if (!fn) {
      return function (fn) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return curry.apply(this, [arity, fn].concat(args));
      };
    }

    var helper = function helper(args) {
      return function () {
        for (var _len3 = arguments.length, rest = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          rest[_key3] = arguments[_key3];
        }

        return currier.call(this, arity, fn, [].concat(_toConsumableArray(args), rest));
      };
    };

    var currier = function currier(length, f, args) {
      if (args.length >= length) {

        // ES 6 classes and built-ins, real or polyfilled, throw a TypeError if you try to call them
        // as a function.
        try {
          return f.apply(this, args);
        } catch (e) {
          if (e instanceof TypeError) {
            return _applyConstructor(f, args);
          } else {
            throw e;
          }
        }
      } else {
        return helper(args);
      }
    };

    return currier.call(this, arity, fn, fnArgs);
  };

  var apply = curry(function (f, args) {
    return f.apply(this, args);
  });

  //debounce :: Number -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var debounce = function debounce(n, immed, f) {
    var _ref3 = function () {
      switch (_extractHiddenClass(immed)) {
        case 'Boolean':
          return [f, immed];
        case 'Function':
          return [immed, false];
        default:
          throw new TypeError('Unrecognized arguments ' + immed + ' and ' + f + ' to function debounce.');
      }
    }(),
        _ref4 = _slicedToArray(_ref3, 2),
        fn = _ref4[0],
        now = _ref4[1];

    var timer = null;
    return function () {
      var _this = this;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      if (timer === null && now) {
        fn.apply(this, args);
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        return fn.apply(_this, args);
      }, n);
      return timer;
    };
  };

  //throttle :: Number -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var throttle = curry(function (delay, fn) {
    var timer = null,
        last = null;
    return function () {
      var _this2 = this;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      var now = Date.now();
      if (last != null && now < last + delay) {
        clearTimeout(timer);
        timer = setTimeout(function () {
          last = now;
          fn.apply(_this2, args);
        }, delay);
      } else {
        last = now;
        fn.apply(this, args);
      }
      return timer;
    };
  });

  // pipe
  // Forward function composition.
  var pipe = function pipe() {
    for (var _len6 = arguments.length, fs = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      fs[_key6] = arguments[_key6];
    }

    return function () {
      var _this3 = this;

      var first = fs.shift();

      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return fs.reduce(function (acc, f) {
        return f.call(_this3, acc);
      }, first.apply(this, args));
    };
  };

  //denodeify :: (* -> *) -> (* -> Promise *)
  //Turns a callback-accepting function into one that returns a Promise.
  var denodeify = function denodeify(fn) {
    var length = fn.length > 0 ? fn.length - 1 : 0;
    var f = function f() {
      var _this4 = this;

      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return new Promise(function (resolve, reject) {
        fn.apply(_this4, [].concat(args, [function (err) {
          for (var _len9 = arguments.length, rest = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
            rest[_key9 - 1] = arguments[_key9];
          }

          if (err) {
            reject(err);
          }
          var result = void 0;
          switch (rest.length) {
            case 0:
              result = true;
              break;
            case 1:
              result = rest[0];
              break;
            default:
              result = rest;
              break;
          }
          resolve(result);
        }]));
      });
    };

    return length ? curry(length, f) : f;
  };

  //trampoline :: (* -> *) -> (* -> *)
  var trampoline = function trampoline(fn) {
    return curry(fn.length, function () {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      var result = fn.apply(this, args);
      while (_extractHiddenClass(result) === 'Function') {
        result = result();
      }
      return result;
    });
  };

  var bindArity = curry(function (n, f) {
    return function () {
      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      return f.apply(this, args.slice(0, n));
    };
  });

  var unary = bindArity(1);

  var _memoized = {};
  var memoize = function memoize(f) {
    return function () {
      for (var _len12 = arguments.length, arr = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        arr[_key12] = arguments[_key12];
      }

      var args = arr.map(function (arg) {
        var s = arg.toString();
        if (s === '[object Object]') {
          throw new TypeError('Unhashable argument to function memoize.');
        }
        return s;
      });

      var str = args.join('');
      var m = _memoized[str];
      if (m) {
        return m;
      } else {
        var res = f.apply(this, arr);
        _memoized[str] = res;
        return res;
      }
    };
  };

  var maybe = function maybe(f) {
    var strict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var method = strict ? 'some' : 'every';
    return function () {
      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
        args[_key13] = arguments[_key13];
      }

      if (f.length && args[method](function (a) {
        return a == null;
      })) return null;
      return f.apply(this, args);
    };
  };

  var applyConstructor = curry(_applyConstructor);

  var bindPromise = function bindPromise(f) {
    return function (p) {
      var _this5 = this;

      return p.then(function (arg) {
        return f.call(_this5, arg);
      });
    };
  };

  exports.trampoline = trampoline;
  exports.pipe = pipe;
  exports.curry = curry;
  exports.bindArity = bindArity;
  exports.unary = unary;
  exports.debounce = debounce;
  exports.throttle = throttle;
  exports.applyConstructor = applyConstructor;
  exports.apply = apply;
  exports.denodeify = denodeify;
  exports.memoize = memoize;
  exports.maybe = maybe;
  exports.bindPromise = bindPromise;
});
