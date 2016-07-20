(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'js-typed'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('js-typed'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.jsTyped);
    global.decoratorsJs = mod.exports;
  }
})(this, function (exports, _jsTyped) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.unary = exports.nary = exports.padInt = exports.parallelize = exports.timeoutP = exports.loopP = exports.bindA = exports.bindP = exports.trampoline = exports.runtime = exports.denodeify = exports.setLocalStorage = exports.log = exports.throttle = exports.debounce = exports.unGather = exports.maybe = undefined;

  var typed = _interopRequireWildcard(_jsTyped);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

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

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  /*
   *Common decorators and combinators I use in Javascript
   *@author Jared Smith
   *@copyright Jared Adam Smith, 2015, 2016
   *Licensed under the MIT license. You should have received a copy with this software, otherwise see
   *https://opensource.org/licenses/MIT.
   *
   */

  //IE workaround for lack of function name property on Functions
  //_getFnName :: (* -> *) -> String
  var _getFnName = function (r) {
    return function (fn) {
      return fn.name || (('' + fn).match(r) || [])[1] || 'Anonymous';
    };
  }(/^\s*function\s*(\S*)\s*\(/);

  var _global = function () {
    switch (true) {
      case 'undefined' !== typeof window:
        return window;
      case 'undefined' !== typeof global:
        return global;
      case 'undefined' !== typeof self:
        return self;
      default:
        return new Function('return this;')();
    }
  }();

  typed.defType('_promise', function (p) {
    return p && typed.respondsTo('then', p);
  });

  var _takesFn = typed.guard(['function']);

  // Extracts internal [[class]] property of a javascript value
  // _extractHiddenClass :: * -> String
  var _extractHiddenClass = function (r) {
    return function (a) {
      return Object.prototype.toString.call(a).match(r)[1].toLowerCase();
    };
  }(/ ([a-z]+)]$/i);

  //unGather :: (* -> *) -> (* -> *)
  //Conditionally unnests the arguments to a function, useful for functions that use rest params to
  //gather args.
  var unGather = _takesFn(function (fn) {
    return typed.curry(fn.length, function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var arr = args[0],
          params = args.length === 1 && typed.isType('array', arr) ? arr : args;
      return fn.apply(this, params);
    });
  });

  //maybe :: (* -> *) -> (* -> *)
  //maybe :: (* -> *) -> (Null -> Null)
  var maybe = _takesFn(function (fn) {
    return typed.curry(fn.length, function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return args.every(function (x) {
        return x != null;
      }) ? fn.apply(this, args) : null;
    });
  });

  //_trim :: String -> String
  var _trim = typed.Dispatcher([[['null'], function (x) {
    return null;
  }], [['string'], function (s) {
    return s.trim();
  }]]);

  //debounce :: Number -> (* -> Null) -> Number
  //debounce :: Number -> Boolean -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
  //is whether the function fires on the leading edge or trailing edge (defaults to false).
  var debounce = function (f) {
    return typed.Dispatcher([[['number', 'boolean', 'function'], function (n, now, fn) {
      return f(n, now, fn);
    }], [['number', 'function'], function (n, fn) {
      return f(n, false, fn);
    }]]);
  }(function (n, now, fn) {
    var timer = null;
    return typed.curry(fn.length, function () {
      var _this = this;

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      if (timer === null && now) {
        fn.apply(this, args);
      }
      clearTimeout(timer);
      timer = setTimeout(function () {
        return fn.apply(_this, args);
      }, n);
      return timer;
    });
  });

  //throttle :: Number -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var throttle = typed.guard(['number', 'function'], function (delay, fn) {
    var timer = null,
        last = null;
    return typed.curry(fn.length, function () {
      var _this2 = this;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
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
  var log = _takesFn(function (fn) {
    return typed.curry(fn.length, function () {
      for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
        args[_key5] = arguments[_key5];
      }

      var res = fn.apply(this, args);
      var result = null,
          name = _getFnName(fn),
          fnArgs = args.length ? args : "no arguments";
      switch (typeof res === 'undefined' ? 'undefined' : _typeof(res)) {
        case 'object':
        case 'undefined':
        case 'string':
          result = res;
          break;
        default:
          result = res.toString();
          break;
      }
      console.log('Fn ' + name + ' called with ' + fnArgs + ' yielding ' + result);
      return res;
    });
  });

  // padInt :: (* -> Number) -> (* -> String)
  // padInt :: Number -> (* -> Number) -> (* -> String)
  // padInt :: Number -> Number -> String
  // Pads the numeric results of the passed-in function with leading zeros up to the given length
  // Can also work as a standalone function if passed two numbers.
  var _padInt = function _padInt(a, b) {
    return '0'.repeat(a) + b;
  };
  var _padResult = function _padResult(n, fn) {
    return function () {
      for (var _len6 = arguments.length, args = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        args[_key6] = arguments[_key6];
      }

      var result = fn.apply(this, args).toString();
      return result.length < n ? _padInt(n - result.length, result) : result;
    };
  };
  var padInt = typed.Dispatcher([[['number', 'function'], _padResult], [['number', 'number'], function (l, n) {
    return _padResult(l, function (x) {
      return x;
    })(n);
  }], [['function'], function (fn) {
    return _padResult(2, fn);
  }]]);

  //setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)
  //setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
  //setLocalStorage :: (Event -> *) -> (Event -> Event)
  //meant to decorate an event handler with adding the current value (or whatever desired property)
  //of the event target to local storage. Passing in null for the second param allows the
  //decorated function to supply alternative values for setting to localStorage.
  var setLocalStorage = function (f) {
    return typed.Dispatcher([[['string', 'string', 'function'], function (prop, val, fn) {
      return f(prop, val, fn);
    }], [['string', 'null', 'function'], function (prop, val, fn) {
      return f(prop, null, fn);
    }], [['string', 'function'], function (val, fn) {
      return f('label', val, fn);
    }], [['null', 'function'], function (val, fn) {
      return f('label', val, fn);
    }], [['function'], function (fn) {
      return f('label', 'value', fn);
    }]]);
  }(function (prop, val, fn) {
    return function (e) {
      var result = fn.call(null, e),
          el = e.currentTarget || this; // e.g. google maps
      var key = el[prop] || _trim(el.parentNode.textContent);
      var value = val === null ? result : _trim(el[val]);
      if (key != null && value != null) {
        localStorage.setItem(key, value);
      }
      return e;
    };
  });
  // const setLocalStorage = (...args) => {
  //   let f = typeGuard(['function', 'string'], (prop, v, func) => {
  //     return curry(1, function(e) {
  //       let arity2 = 'function' === typeof v;
  //       let val    = arity2 ? 'value' : v;
  //       let fn     = arity2 ? v : func;
  //       let result = fn.call(null, e), el = e.currentTarget || this; //google maps
  //
  //       //second half is for labels
  //       let key = el[prop] || el.parentNode.textContent.trim();
  //       let value = val === null ? result : _trim(el[val]);
  //       if (key != null && value != null) {
  //         localStorage.setItem(key, value);
  //       }
  //       return e;
  //     });
  //   });
  //
  //   switch (false) {
  //     case (!(args.length === 1)):
  //       if ('function' === typeof args[0]) {
  //         return f('label', 'value', args[0]);
  //       } else {
  //         return f(args[0]);
  //       }
  //     case (!(args.length === 2 && 'function' === typeof args[1])):
  //       let [value, fn] = args;
  //       return f('label', value, fn);
  //     default:
  //       return f(...args);
  //   }
  // };

  //denodeify :: (* -> *) -> (* -> Promise *)
  //Turns a callback-accepting function into one that returns a Promise.
  var denodeify = _takesFn(function (fn) {
    var length = fn.length > 0 ? fn.length - 1 : 0;
    return typed.curry(length, function () {
      var _this3 = this;

      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return new Promise(function (resolve, reject) {
        fn.apply(_this3, [].concat(args, [function (err) {
          for (var _len8 = arguments.length, rest = Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
            rest[_key8 - 1] = arguments[_key8];
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
    });
  });

  //runtime :: (* -> *) -> (* -> *)
  var runtime = _takesFn(function (f) {
    var fn = log(f),
        name = _getFnName(f);
    return typed.curry(f.length, function () {
      console.time(name);

      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
      }

      var result = fn.apply(this, args);
      console.timeEnd(name);
      return result;
    });
  });

  //trampoline :: (* -> *) -> (* -> *)
  var trampoline = _takesFn(function (fn) {
    return typed.curry(fn.length, function () {
      for (var _len10 = arguments.length, args = Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
        args[_key10] = arguments[_key10];
      }

      var result = fn.apply(this, args);
      while (typed.isType('function', result)) {
        result = result();
      }
      return result;
    });
  });

  // //lift :: (a -> m a) -> (a -> b) -> (m a -> m b)
  // //takes a type constructor for type a and wraps the return value of the passed-in function in type
  // //a. Type constructors should be guarded, for an example see liftP and liftA below. Note that if the
  // //function returns an *array* then array will be applied to the constructor, i.e. constructors
  // //requiring `new` should be wrapped in typed.guardClass.
  // const lift = typed.guard(['function','function'], (constructor, fn) => {
  //   return typed.curry(fn.length, function(...args) {
  //     let result = fn.apply(this, args);
  //     switch(_extractHiddenClass(result)) {
  //       case 'array': return constructor(...result);
  //       case 'undefined': return constructor();
  //       default: return constructor(result);
  //     }
  //   });
  // });
  //
  // //liftA :: (* -> *) -> (* -> [*])
  // const liftA = lift(unGather((...args) => args));

  //bindP :: (* -> Promise *) -> (Promise * -> Promise *)
  var bindP = _takesFn(function (fn) {
    return typed.guard('_promise', function (p) {
      var _this4 = this;

      return p.then(function (a) {
        return fn.call(_this4, a);
      });
    });
  });

  //bindA :: (* -> [*]) -> ([*] -> [*])
  //Note about context, if you pass initial arguments besides the function to be decorated the
  //context will be bound at that time.
  var bindA = _takesFn(function (fn) {
    return function (args) {
      var result = fn.apply(this, args);
      return typed.isType('array', result) ? result : [result];
    };
  });

  //loopP :: (* -> *) -> (Null -> Promise *)
  //Starts a loop that continually calls the promise-returning function each time the previous
  //iteration resolves with the value of that resolution. Useful for long-polling. Returns a function
  //that when called breaks the loop and returns a Promise of last value.
  var loopP = function (err) {
    //return _fnFirst(function(fn, ...args) {
    return _takesFn(function (fn) {
      for (var _len11 = arguments.length, args = Array(_len11 > 1 ? _len11 - 1 : 0), _key11 = 1; _key11 < _len11; _key11++) {
        args[_key11 - 1] = arguments[_key11];
      }

      var done = false,
          result = fn.apply(undefined, args),
          promise = Promise.resolve(result);
      var update = function update(val) {
        return promise = fn(val).then(function (v) {
          if (!done) {
            setTimeout(enqueue, 0);
          }
          return v;
        });
      };
      var enqueue = function enqueue() {
        return promise.then(function (v) {
          if (!done) {
            update(v);
          }
          return v;
        });
      };
      promise.then(update);
      return function () {
        done = true;
        return promise;
      };
    });
  }(new TypeError('Callback function must return a Promise'));

  //timeoutP :: Number -> (* -> Promise *) -> (* -> Promise *)
  //Rejects if the promise takes longer than the given delay to resolve.
  //Timeout in milliseconds.
  var timeoutP = typed.guard(['number', 'function'], function (timeout, fn) {
    return typed.curry(fn.length, function () {
      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      var promise = Promise.resolve(fn.apply(this, args));
      var resolved = false;
      promise.then(function () {
        return resolved = true;
      });
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          if (resolved) {
            resolve(promise);
          } else {
            reject(new Error('Promise from function ' + _getFnName(fn) + '\n            failed to resolve in ' + timeout / 1000 + ' seconds.'));
          }
        }, timeout);
      });
    });
  });

  var parallelize = function (template, f) {
    return typed.Dispatcher([[['function'], function (fn) {
      return f(new Blob([template(fn)], { type: 'application/javascript' }));
    }], [['string'], function (str) {
      return f(new Blob([template(str)], { type: 'application/javascript' }));
    }], [['blob'], function (b) {
      return f(b);
    }], [['array'], function (arr) {
      return f(new Blob(arr));
    }]]);
  }(function (str) {
    return 'onmessage = function(e) { postMessage((' + str + ')(e.data)) }';
  }, function (blob) {
    var url = URL.createObjectURL(blob);
    var worker = new Worker(url);
    URL.revokeObjectURL(url);
    return unGather(function () {
      for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
        args[_key13] = arguments[_key13];
      }

      return new Promise(function (resolve, reject) {
        var errHandle = function errHandle(e) {
          reject(new Error(e.message + ' - ' + e.filename + ': ' + e.lineno));
        };
        var listener = function listener(e) {
          worker.removeEventListener('message', listener);
          worker.removeEventListener('error', errHandle);
          resolve(e.data);
        };
        worker.addEventListener('message', listener);
        worker.addEventListener('error', errHandle);
        worker.postMessage(args.length > 1 ? args : args[0]);
      });
    });
  });

  // nary :: Number -> (a -> b) -> a -> b
  var nary = typed.guard(['number', 'function'], function (n, f) {
    return function () {
      for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
        args[_key14] = arguments[_key14];
      }

      return f.apply(undefined, _toConsumableArray(args.slice(0, n)));
    };
  });

  var unary = nary(1);

  exports.maybe = maybe;
  exports.unGather = unGather;
  exports.debounce = debounce;
  exports.throttle = throttle;
  exports.log = log;
  exports.setLocalStorage = setLocalStorage;
  exports.denodeify = denodeify;
  exports.runtime = runtime;
  exports.trampoline = trampoline;
  exports.bindP = bindP;
  exports.bindA = bindA;
  exports.loopP = loopP;
  exports.timeoutP = timeoutP;
  exports.parallelize = parallelize;
  exports.padInt = padInt;
  exports.nary = nary;
  exports.unary = unary;
});
