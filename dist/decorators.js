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
    var self = self || null;
    return window || global || self;
  };

  /*   Functions   */

  //curry ([*] -> *) -> ([*] -> *)
  //curry Number -> ([*] -> *) -> ([*] -> *)
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
            return _curry.call(ctx, n, func);
          };
        default:
          throw new Error('Type ' + (typeof n === 'undefined' ? 'undefined' : _typeof(n)) + ' unable to be curried.');
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

  //_isNan :: has IE workaround for lack of Number.isNaN
  var _isNaN = function _isNaN(n) {
    return n !== n;
  };

  //typeGuard :: [String] -> (a -> *) -> (a -> *)
  var typeGuard = function (check, getType) {
    return curry(function (ts, fn) {
      var arr = _isArray(ts) && ts.length ? ts : [ts];
      var types = arr.map(function (t) {
        return 'string' === typeof t ? t.toLowerCase() : t;
      });
      //keep all the args, but typecheck the first only, assume curried
      return curry(fn.length, function () {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        var test = check(args[0]);
        var passed = types.some(test);
        if (!passed) {
          var type = getType(args[0]),
              expected = types.map(getType).join(',');
          throw new TypeError('In fn ' + _getFnName(fn) + ' expected one of ' + expected + ', got ' + type + '.');
        }
        return fn.apply(this, args);
      });
    });
  }(curry(function (arg, type) {
    var passed = false,
        argType = typeof arg === 'undefined' ? 'undefined' : _typeof(arg),
        t = typeof type === 'undefined' ? 'undefined' : _typeof(type),
        clazz = _class(arg);
    switch (true) {
      case type === arg:
      case type === argType && 'object' !== argType:
      case 'function' === t && arg instanceof type:
      case 'object' === t && arg instanceof type.constructor:
      case 'object' === t && clazz !== 'Object' && _class(type) === clazz: //null et al
      case _class(arg).toLowerCase() === type:
        passed = true;
        break;
    }
    return passed;
  }), function (t) {
    switch (true) {
      case 'string' === typeof t:
        return t;
      case 'symbol' === (typeof t === 'undefined' ? 'undefined' : _typeof(t)):
      case 'undefined' === typeof t:
      case 'boolean' === typeof t:
      case 'number' === typeof t:
        return typeof t === 'undefined' ? 'undefined' : _typeof(t);
      case 'function' === typeof t:
        return _getFnName(t); //assume constructor
      case 'object' === (typeof t === 'undefined' ? 'undefined' : _typeof(t)):
        return null === t ? 'null' : t.constructor.name || _class(t);
    }
  });

  //_fnFirst :: (* -> *) -> (* -> *)
  var _fnFirst = typeGuard('function');

  //unGather :: (* -> *) -> (* -> *)
  //Conditionally unnests the arguments to a function, useful for functions that use rest params to
  //gather args.
  var unGather = _fnFirst(function () {
    for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
      args[_key5] = arguments[_key5];
    }

    var fn = args[0];
    var initArgs = args.slice(1);

    var f = curry(fn.length, function () {
      for (var _len6 = arguments.length, fnArgs = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
        fnArgs[_key6] = arguments[_key6];
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
    return curry(fn.length, function () {
      for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
        args[_key7] = arguments[_key7];
      }

      return args.every(function (x) {
        return x != null;
      }) ? fn.apply(this, args) : null;
    });
  });

  //_trim :: String -> String
  var _trim = maybe(typeGuard('string', function (str) {
    return str.trim();
  }));

  //debounce :: Number -> (* -> Null) -> Number
  //debounce :: Number -> Boolean -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
  //is whether the function fires on the leading edge or trailing edge (defaults to false).
  var debounce = function (f) {
    return curry(2, typeGuard('number', function () {
      for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
        args[_key8] = arguments[_key8];
      }

      var delay = args[0];
      var a = args[1];
      var b = args[2];

      return 'function' === typeof a ? f(delay, false, a) : 'undefined' === typeof b ? typeGuard('function', f(delay, a)) : typeGuard('function', f(delay, a))(b);
    }));
  }(curry(function (n, now, fn) {
    var timer = null;
    return curry(fn.length, function () {
      var _this = this;

      for (var _len9 = arguments.length, args = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
        args[_key9] = arguments[_key9];
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
  }));

  //throttle :: Number -> (* -> Null) -> Number
  //Delay in milliseconds. Returns the timer ID so caller can cancel
  var throttle = curry(function (delay, fn) {
    if ('function' !== typeof fn) {
      throw new TypeError("Cannot throttle a non-function");
    }
    var timer = null,
        last = null;
    return curry(fn.length, function () {
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
    return curry(fn.length, function () {
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
    });
  });

  //padInt :: (* -> Number) -> (* -> String)
  //padInt :: Number -> (* -> Number) -> (* -> String)
  //padInt :: Number -> Number -> String
  //Pads the numeric results of the passed-in function with leading zeros up to the given length
  //(defaults to 2). Can also work as a standalone function if passed two numbers.
  var padInt = function (f) {
    return typeGuard(['function', 'number'], function () {
      for (var _len12 = arguments.length, args = Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
        args[_key12] = arguments[_key12];
      }

      var a = args[0];
      var b = args[1];

      var x = void 0,
          y = void 0;
      if ('function' === typeof a) {
        x = 2, y = a;
      } else {
        x = a;
        if ('undefined' !== typeof b) {
          y = b;
        }
      }
      return y ? f(x, y) : f(x);
    });
  }(function (fn) {
    return curry(function (z, c) {
      return 'function' !== typeof c ? fn(z, c) : curry(c.length, function () {
        for (var _len13 = arguments.length, args = Array(_len13), _key13 = 0; _key13 < _len13; _key13++) {
          args[_key13] = arguments[_key13];
        }

        return fn(z, c.apply(this, args));
      });
    });
  }(typeGuard('number', function (z, num) {
    var str = '' + num;
    if (_isNaN(+str)) {
      throw new TypeError('Can only pad a number or numeric string');
    }
    while (str.length < z) {
      str = '0' + str;
    }
    return str;
  })));

  //setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)
  //setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
  //setLocalStorage :: (Event -> *) -> (Event -> Event)
  //meant to decorate an event handler with adding the current value (or whatever desired property)
  //of the event target to local storage. Passing in null for the second param allows the
  //decorated function to supply alternative values for setting to localStorage.
  var setLocalStorage = function setLocalStorage() {
    for (var _len14 = arguments.length, args = Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
      args[_key14] = arguments[_key14];
    }

    var f = typeGuard(['function', 'string'], function (prop, v, func) {
      return curry(1, function (e) {
        var arity2 = 'function' === typeof v;
        var val = arity2 ? 'value' : v;
        var fn = arity2 ? v : func;
        var result = fn.call(null, e),
            el = e.currentTarget || this; //google maps

        //second half is for labels
        var key = el[prop] || el.parentNode.textContent.trim();
        var value = val === null ? result : _trim(el[val]);
        if (key != null && value != null) {
          localStorage.setItem(key, value);
        }
        return e;
      });
    });

    switch (false) {
      case !(args.length === 1):
        if ('function' === typeof args[0]) {
          return f('label', 'value', args[0]);
        } else {
          return f(args[0]);
        }
      case !(args.length === 2 && 'function' === typeof args[1]):
        var value = args[0];
        var fn = args[1];

        return f('label', value, fn);
      default:
        return f.apply(undefined, args);
    }
  };

  //denodeify :: (* -> *) -> (* -> Promise *)
  //Turns a callback-accepting function into one that returns a Promise.
  var denodeify = _fnFirst(function (fn) {
    var length = fn.length > 0 ? fn.length - 1 : 0;
    return curry(length, function () {
      var _this3 = this;

      for (var _len15 = arguments.length, args = Array(_len15), _key15 = 0; _key15 < _len15; _key15++) {
        args[_key15] = arguments[_key15];
      }

      return new Promise(function (resolve, reject) {
        fn.apply(_this3, [].concat(args, [function (err) {
          for (var _len16 = arguments.length, rest = Array(_len16 > 1 ? _len16 - 1 : 0), _key16 = 1; _key16 < _len16; _key16++) {
            rest[_key16 - 1] = arguments[_key16];
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

  //unNew :: (* -> a) -> (* -> a)
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
      }
      return curry(length, function () {
        for (var _len17 = arguments.length, args = Array(_len17), _key17 = 0; _key17 < _len17; _key17++) {
          args[_key17] = arguments[_key17];
        }

        return construct.apply(undefined, [ctor].concat(args));
      });
    };
    return fn;
  }(function () {
    for (var _len18 = arguments.length, args = Array(_len18), _key18 = 0; _key18 < _len18; _key18++) {
      args[_key18] = arguments[_key18];
    }

    var ctor = args[0];

    return new (ctor.bind.apply(ctor, args))();
  });

  //runtime :: (* -> *) -> (* -> *)
  var runtime = _fnFirst(function (f) {
    var fn = log(f),
        name = _getFnName(f);
    return curry(f.length, function () {
      console.time(name);

      for (var _len19 = arguments.length, args = Array(_len19), _key19 = 0; _key19 < _len19; _key19++) {
        args[_key19] = arguments[_key19];
      }

      var result = fn.apply(this, args);
      console.timeEnd(name);
      return result;
    });
  });

  //trampoline :: (* -> *) -> (* -> *)
  var trampoline = _fnFirst(function (fn) {
    return curry(fn.length, function () {
      for (var _len20 = arguments.length, args = Array(_len20), _key20 = 0; _key20 < _len20; _key20++) {
        args[_key20] = arguments[_key20];
      }

      var result = fn.apply(this, args);
      while (result instanceof Function) {
        result = result();
      }
      return result;
    });
  });

  //lift :: (* -> a) -> (* -> *) -> (* -> a)
  //takes a type constructor for type a and wraps the return value of the passed-in function in type
  //a. Type constructors should be guarded, for an example see liftP and liftA below. Note that if the
  //function returns an *array* then array will be applied to the constructor, i.e. constructors
  //requiring `new` should be wrapped in unNew.
  var lift = curry(function (constructor, fn) {
    return curry(fn.length, function () {
      for (var _len21 = arguments.length, args = Array(_len21), _key21 = 0; _key21 < _len21; _key21++) {
        args[_key21] = arguments[_key21];
      }

      var result = fn.apply(this, args);
      switch (false) {
        case !_isArray(result):
          return constructor.apply(undefined, _toConsumableArray(result));
        case 'undefined' !== typeof result:
          return constructor();
        default:
          return constructor(result);
      }
    });
  });

  //liftP :: (* -> *) -> (* -> Promise *)
  //I do this often enough for Promises that I baked it in.
  var liftP = lift(function () {
    for (var _len22 = arguments.length, args = Array(_len22), _key22 = 0; _key22 < _len22; _key22++) {
      args[_key22] = arguments[_key22];
    }

    return Promise.resolve(args.length > 1 ? args : args[0]);
  });

  //liftA :: (* -> *) -> (* -> [*])
  //ditto arrays
  var liftA = lift(unGather(function () {
    for (var _len23 = arguments.length, args = Array(_len23), _key23 = 0; _key23 < _len23; _key23++) {
      args[_key23] = arguments[_key23];
    }

    return args;
  }));

  //bindP :: (* -> Promise *) -> (Promise * -> Promise *)
  var bindP = _fnFirst(function (fn) {
    return curry(1, function (promise) {
      var _this4 = this;

      return promise.then(function (a) {
        return fn.call(_this4, a);
      });
    });
  });

  //bindA :: (* -> [*]) -> ([*] -> [*])
  //Note about context, if you pass initial arguments besides the function to be decorated the
  //context will be bound at that time.
  var bindA = _fnFirst(function () {
    for (var _len24 = arguments.length, args = Array(_len24), _key24 = 0; _key24 < _len24; _key24++) {
      args[_key24] = arguments[_key24];
    }

    var fn = args[0];
    var initArgs = args.slice(1);

    var f = function f(fnArgs) {
      var result = fn.apply(this, fnArgs);
      return _isArray(result) ? result : [result];
    };
    return initArgs.length ? f.apply(this, initArgs) : f;
  });

  //loopP :: (* -> *) -> (Null -> Promise *)
  //Starts a loop that continually calls the promise-returning function each time the previous
  //iteration resolves with the value of that resolution. Useful for long-polling. Returns a function
  //that when called breaks the loop and returns a Promise of last value.
  var loopP = function (err) {
    return _fnFirst(function (fn) {
      for (var _len25 = arguments.length, args = Array(_len25 > 1 ? _len25 - 1 : 0), _key25 = 1; _key25 < _len25; _key25++) {
        args[_key25 - 1] = arguments[_key25];
      }

      var done = false,
          promise = fn.apply(undefined, args);
      if ('function' !== typeof promise.then) {
        throw err;
      }
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
  var timeoutP = typeGuard('number', function (timeout, fn) {
    return curry(fn.length, function () {
      for (var _len26 = arguments.length, args = Array(_len26), _key26 = 0; _key26 < _len26; _key26++) {
        args[_key26] = arguments[_key26];
      }

      var promise = fn.apply(this, args);
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

  var parallelize = function (template) {
    return typeGuard(['function', 'string', 'Blob', Array], function (arg) {
      var blob = function () {
        switch (false) {
          case !(arg instanceof Blob):
            return arg;
          case !_isArray(arg):
            return new Blob(arg);
          case !('function' === typeof arg):
          case !'string' === (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)):
            return new Blob([template(arg)]);
        }
      }();
      var url = URL.createObjectURL(blob);
      var worker = new Worker(url);
      URL.revokeObjectURL(url);
      return unGather(function () {
        for (var _len27 = arguments.length, args = Array(_len27), _key27 = 0; _key27 < _len27; _key27++) {
          args[_key27] = arguments[_key27];
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
  }(function (str) {
    return 'onmessage = function(e) { postMessage((' + str + ')(e.data)) }';
  });

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
  exports.lift = lift;
  exports.liftP = liftP;
  exports.liftA = liftA;
  exports.bindP = bindP;
  exports.bindA = bindA;
  exports.loopP = loopP;
  exports.timeoutP = timeoutP;
  exports.parallelize = parallelize;
  exports.padInt = padInt;
});
