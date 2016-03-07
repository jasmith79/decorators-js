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
    global.decorators = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  /*
   *Common decorators I use in javascript
   *@author Jared Smith
   *@copyright Jared Adam Smith, 2015
   *Licensed under the MIT license. You should have received a copy with this software, otherwise see
   *https://opensource.org/licenses/MIT.
   *
   */

  var _global = function _global() {
    var window = window || null;
    var global = global || null;
    return window || global;
  };

  /*   Functions   */

  //curry ([a] -> a) -> ([a] -> a)
  //curry Integer -> ([a] -> a) -> ([a] -> a)
  //inspired by Nick Fitzgerald's implementation for wu.js
  var curry = function (c) {
    var _curry = function _curry(n, f) {
      var length = void 0,
          fn = void 0,
          ctx = this === _global ? null : this;
      switch (true) {
        case f != null:
          fn = f, length = n;
          break;
        case 'function' === typeof n:
          fn = n, length = n.length;
          break;
        case 'number' === typeof n:
          return function (func) {
            return _curry.call(null, n, func);
          };
        default:
          throw new Error('Type ' + (typeof n === 'undefined' ? 'undefined' : _typeof(n)) + ' unable to be curried.');
          break;
      }
      return function () {
        var ctx = this === _global ? null : this;

        for (var _len = arguments.length, fnArgs = Array(_len), _key = 0; _key < _len; _key++) {
          fnArgs[_key] = arguments[_key];
        }

        if (fnArgs.length < length) {
          var currLength = length - fnArgs.length;
          var curried = c.apply(ctx, [fn].concat(fnArgs));
          return currLength > 0 ? _curry.call(null, currLength, curried) : curried;
        } else {
          return fn.apply(ctx, fnArgs);
        }
      };
    };
    return _curry;
  }(function (fn) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var ctx = this === _global ? null : this;
    return function () {
      for (var _len3 = arguments.length, fnArgs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        fnArgs[_key3] = arguments[_key3];
      }

      return fn.apply(ctx, [].concat(args, fnArgs));
    };
  });

  //IE workaround for lack of function name property on Functions
  //_getFnName :: (* -> *) -> String
  var _getFnName = function (r) {
    return function (fn) {
      return fn.name || (('' + fn).match(r) || [])[1] || 'Anonymous';
    };
  }(/^\s*function\s*(\S*)\s*\(/);

  //Extracts internal [[class]] property of a javascript value
  //_class :: * -> String
  var _class = function (r) {
    return function (a) {
      return Object.prototype.toString.call(a).match(r)[1];
    };
  }(/\s([a-zA-Z]+)/);

  //_isArray :: * -> Boolean
  //IE workaround for lack of Array.isArray
  var _isArray = function _isArray(a) {
    return _class(a) === 'Array' || a instanceof Array;
  };

  //typeGuard :: String -> (* -> *) -> (* -> *)
  //typeGuard :: (* -> Object) -> (* -> *) -> (* -> *)
  var typeGuard = curry(function (t, fn) {
    return function () {
      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      var arg = args[0],
          ctx = this === _global ? null : this,
          passed = false;
      var first = 'string' === typeof arg ? arg.toLowerCase() : arg;
      var type = 'string' === typeof t ? t.toLowerCase() : t;
      var argType = typeof first === 'undefined' ? 'undefined' : _typeof(first);
      switch (true) {
        case type === first:
        case type === argType && 'object' !== argType:
        case 'function' === typeof type && first instanceof type:
        case 'object' === argType && ('object' === type || Object === type):
        case 'object' === argType && first === null && type === 'null':
        case _class(first).toLowerCase() === type:
          passed = true;
          break;
      }
      if (!passed) {
        throw new TypeError('In fn ' + _getFnName(fn) + ' expected ' + type + ', got ' + first + '.');
      }
      return fn.apply(ctx, args);
    };
  });

  //_fnFirst :: (* -> *) -> (* -> *)
  var _fnFirst = typeGuard('function');

  //_noGlobalCtx :: (* -> a) -> (* -> a)
  //Ensures passed-in function is not executed with global context set to `this`. Returned function
  //is automatically curried.
  var _noGlobalCtx = _fnFirst(function (fn) {
    return curry(fn.length, function () {
      var ctx = this === _global ? null : this;

      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      return fn.apply(ctx, args);
    });
  });

  //unGather :: (* -> *) -> (* -> *)
  //Conditionally unnests the arguments to a function, useful for functions that use rest params to
  //gather args.
  var unGather = _fnFirst(function () {
    for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
      args[_key6] = arguments[_key6];
    }

    var fn = args[0];
    var initArgs = args.slice(1);

    var f = _noGlobalCtx(function () {
      for (var _len7 = arguments.length, fnArgs = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        fnArgs[_key7] = arguments[_key7];
      }

      var arr = fnArgs[0],
          params = fnArgs.length === 1 && _isArray(arr) ? arr : fnArgs;
      return fn.apply(this, params);
    });
    return initArgs.length ? f.apply(this, initArgs) : f;
  });

  //maybe :: (* -> *) -> (* -> *)
  //maybe :: (* -> *) -> (Null -> Null)
  var maybe = _fnFirst(function (fn) {
    return _noGlobalCtx(curry(fn.length, function () {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      return args.every(function (x) {
        return x != null;
      }) ? fn.apply(this, args) : null;
    }));
  });

  //_trim :: String -> String
  var _trim = maybe(typeGuard('string', function (str) {
    return str.trim();
  }));

  //debounce :: Integer -> (* -> Null) -> Integer
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var debounce = curry(function (delay, fn) {
    if ('function' !== typeof fn) {
      throw new TypeError("Cannot debounce a non-function");
    }
    var timer = null;
    return _noGlobalCtx(function () {
      var _this = this;

      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      clearTimeout(timer);
      timer = setTimeout(function () {
        return fn.apply(_this, args);
      }, delay);
      return timer;
    });
  });

  //throttle :: Integer -> (* -> Null) -> Integer
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var throttle = curry(function (delay, fn) {
    if ('function' !== typeof fn) {
      throw new TypeError("Cannot debounce a non-function");
    }
    var timer = null,
        last = null;
    return _noGlobalCtx(function () {
      var _this2 = this;

      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
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
    });
  });

  //log :: (* -> *) -> [*] -> *
  var log = _fnFirst(function (fn) {
    return curry(fn.length, _noGlobalCtx(function () {
      for (var _len11 = arguments.length, args = Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
        args[_key11] = arguments[_key11];
      }

      var res = fn.apply(this, args);
      var result = null,
          name = _getFnName(fn),
          fnArgs = args.length ? args : "no arguments";
      switch (typeof res === 'undefined' ? 'undefined' : _typeof(res)) {
        case 'object':
        case 'string':
          result = res;
          break;
        default:
          result = res.toString();
          break;
      }
      console.log('Fn ' + name + ' called with ' + fnArgs + ' yielding ' + result);
      return res;
    }));
  });

  //setLocalStorage :: (Event -> [String]), String, String -> (Event -> Event)
  //meant to decorate an event handler with adding the current value (or whatever desired property)
  //of the event target to local storage. The check on the return value of the function allows the
  //decorated function to supply alternative values for setting to localStorage.
  var setLocalStorage = _fnFirst(function (fn) {
    var prop = arguments.length <= 1 || arguments[1] === undefined ? 'label' : arguments[1];
    var val = arguments.length <= 2 || arguments[2] === undefined ? 'value' : arguments[2];

    return _noGlobalCtx(function (e) {
      var result = fn.call(this, e),
          el = e.currentTarget;

      //second half is for labels
      var key = el[prop] || el.parentNode.textContent.trim();
      var value = _trim(el[val]);
      if (key != null && value != null) {
        localStorage.setItem(key, value);
      }
      return e;
    });
  });

  //denodeify :: (* -> a) -> (* -> Promise a)
  //Turns a callback-accepting function into one that returns a Promise.
  var denodeify = _fnFirst(function (fn) {
    var length = fn.length > 0 ? fn.length - 1 : 0;
    return curry(length, _noGlobalCtx(function () {
      var _this3 = this;

      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      return new Promise(function (resolve, reject) {
        fn.apply(_this3, [].concat(args, [function (err) {
          for (var _len13 = arguments.length, rest = Array(_len13 > 1 ? _len13 - 1 : 0), _key13 = 1; _key13 < _len13; _key13++) {
            rest[_key13 - 1] = arguments[_key13];
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
    }));
  });

  //unNew :: (* -> {k:v}) -> (* -> {k:v})
  //Wraps a constructor so that it may be not only called without new but used with .apply(). Note
  //unlike ramda's `construct` the unNewed constructor is variadic.
  var unNew = function (construct) {
    var fn = function fn(n, f) {
      var length = void 0,
          ctor = void 0;
      switch (true) {
        case f != null:
          ctor = f, length = n;
          break;
        case 'function' === typeof n:
          ctor = n, length = n.length;
          break;
        default:
          throw new Error('Type ' + (typeof n === 'undefined' ? 'undefined' : _typeof(n)) + ' unable to be called as a constructor.');
          break;
      }
      return curry(length, function () {
        for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
          args[_key14] = arguments[_key14];
        }

        return construct.apply(undefined, [ctor].concat(args));
      });
    };
    return fn;
  }(function () {
    for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
      args[_key15] = arguments[_key15];
    }

    var ctor = args[0];

    return new (ctor.bind.apply(ctor, args))();
  });

  //runtime :: (* -> *) -> (* -> *)
  var runtime = _fnFirst(function (f) {
    var fn = log(f),
        name = _getFnName(f);
    return _noGlobalCtx(curry(f.length, function () {
      console.time(name);

      for (var _len16 = arguments.length, args = Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
        args[_key16] = arguments[_key16];
      }

      var result = fn.apply(this, args);
      console.timeEnd(name);
      return result;
    }));
  });

  //trampoline :: (* -> *) -> (* -> *)
  var trampoline = _fnFirst(function (fn) {
    return _noGlobalCtx(function () {
      for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
        args[_key17] = arguments[_key17];
      }

      var result = fn.apply(this, args);
      while (result instanceof Function) {
        result = result();
      }
      return result;
    });
  });

  //liftP :: (* -> *) -> (* -> Promise *)
  var liftP = _fnFirst(function (fn) {
    return _noGlobalCtx(curry(fn.length, function () {
      for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
        args[_key18] = arguments[_key18];
      }

      return Promise.resolve(fn.apply(this, args));
    }));
  });

  //bindP :: (* -> Promise *) -> (Promise * -> Promise *)
  var bindP = _fnFirst(function (fn) {
    return _noGlobalCtx(function (promise) {
      var _this4 = this;

      return promise.then(function (a) {
        return fn.call(_this4, a);
      });
    });
  });

  //loopP :: (Null -> *) -> (Null -> Promise *)
  //Starts a loop that continually calls the promise-returning function each time the previous
  //iteration resolves. These calls should primarily be concerned with side-effects like updating
  //the DOM. Useful for long-polling. Returns a function that when called breaks the loop and returns
  //a Promise of last value.
  var loopP = function (err) {
    return _fnFirst(_noGlobalCtx(function (fn) {
      var done = false,
          promise = fn();
      if ('function' !== typeof promise.then) {
        throw err;
      }
      var update = function update() {
        return promise = fn().then(function (v) {
          if (!done) {
            enqueue();
          }
          return v;
        });
      };
      var enqueue = function enqueue() {
        return promise.then(function (v) {
          if (!done) {
            update();
          }
          return v;
        });
      };
      promise.then(update);
      return function () {
        done = true;
        return promise;
      };
    }));
  }(new TypeError('Callback function must return a Promise'));

  exports.curry = curry;
  exports.typeGuard = typeGuard;
  exports.maybe = maybe;
  exports.unGather = unGather;
  exports.debounce = debounce;
  exports.throttle = throttle;
  exports.log = log;
  exports.setLocalStorage = setLocalStorage;
  exports.denodeify = denodeify;
  exports.unNew = unNew;
  exports.runtime = runtime;
  exports.trampoline = trampoline;
  exports.liftP = liftP;
  exports.bindP = bindP;
  exports.loopP = loopP;
});
