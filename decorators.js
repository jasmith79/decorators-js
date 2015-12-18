
/*
Common decorators
 *@author Jared Smith
 */

(function() {
  var MOD_NAME, MOD_SYSTEM, debounce, denodeify, extern, getFnName, include, log, onlyIf, setLocalStorage, throttle, timeoutP, _global,
    __slice = [].slice;

  _global = (function() {
    switch (false) {
      case typeof window === "undefined" || window === null:
        return window;
      case typeof global === "undefined" || global === null:
        return global;
      case typeof this === "undefined" || this === null:
        return this;
      default:
        return {};
    }
  }).call(this);

  MOD_NAME = 'Decorators';

  MOD_SYSTEM = (function() {
    switch (false) {
      case !((typeof module !== "undefined" && module !== null) && (module.exports != null) && typeof require === 'function'):
        return 'commonJS';
      case !(typeof requirejs === 'function' && typeof define === 'function' && (define.amd != null)):
        return 'AMD';
      case !((typeof System !== "undefined" && System !== null) && typeof System["import"] === 'function'):
        return 'systemJS';
      default:
        return null;
    }
  })();


  /* Utils */

  include = function(identifier, property) {
    if (property == null) {
      property = identifier;
    }
    switch (MOD_SYSTEM) {
      case 'commonJS':
        return require(identifier);
      case 'AMD':
        throw new Error("Asynchronous Modules not supported");
        break;
      case 'systemJS':
        return _global.System["import"](identifier);
      default:
        return _global[property] || (function() {
          throw new Error("Unable to import module " + identifier + ", no global property " + property);
        })();
    }
  };

  extern = function(a) {
    switch (MOD_SYSTEM) {
      case 'commonJS':
        return module.exports = a;
      case 'AMD':
        throw new Error("Asynchronous Modules not supported");
        break;
      case 'systemJS':
        return _global.System.set(MOD_NAME, System.newModule(a));
      default:
        return _global[MOD_NAME] = a;
    }
  };

  getFnName = function(fn) {
    if (typeof fn !== 'function') {
      throw new Error("Non function passed to getFnName");
    }
    if (fn.name != null) {
      return fn.name;
    } else {
      return fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
    }
  };


  /* Decorators */

  onlyIf = function(fn, thisArg) {
    if (thisArg == null) {
      thisArg = null;
    }
    return function() {
      var args, passed, test;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      test = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
      passed = fn.length && test.length === 0 ? false : test.every(function(x) {
        return x != null;
      });
      if (passed) {
        return fn.apply(thisArg, args);
      } else {
        return null;
      }
    };
  };

  debounce = function(delay, fn) {
    var context, func, timer;
    if (delay == null) {
      throw Error("Function debounce called with no timeout.");
    }
    timer = null;
    context = this === _global ? null : this;
    func = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      clearTimeout(timer);
      timer = setTimeout((function() {
        return fn.apply(context, args);
      }), delay);
      return timer;
    };
    if (fn != null) {
      return func;
    } else {
      return function(fnArg) {
        return debounce(delay, fnArg);
      };
    }
  };

  throttle = function(delay, fn) {
    var context, func, last, timer;
    if (delay == null) {
      throw Error("Function throttle called with no timeout.");
    }
    last = null;
    timer = null;
    context = this === _global ? null : this;
    func = function() {
      var args, now;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      now = Date.now();
      if ((last != null) && now < last + delay) {
        clearTimeout(timer);
        timer = setTimeout((function() {
          last = now;
          return fn.apply(context, args);
        }), delay);
      } else {
        last = now;
        fn.apply(context, args);
      }
      return timer;
    };
    if (fn != null) {
      return func;
    } else {
      return function(fnArg) {
        return throttle(delay, fnArg);
      };
    }
  };

  log = (function(_this) {
    return function(fn) {
      return function() {
        var args, res;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        res = fn.apply(_this, args);
        console.log("Function " + (getFnName(fn)) + " called with arguments " + args + " and yielded " + res);
        return res;
      };
    };
  })(this);

  setLocalStorage = function(fn, prop, val) {
    if (prop == null) {
      prop = 'label';
    }
    if (val == null) {
      val = 'value';
    }
    return function(e) {
      var key, result, value;
      result = fn(e);
      if (Array.isArray(result)) {
        key = result[0], value = result[1];
      }
      if (key == null) {
        key = e.target[prop] || e.target.parentNode.innerText.trim();
      }
      if (value == null) {
        value = ((function() {
          switch (typeof e.target[val]) {
            case 'string':
            case 'undefined':
              return e.target[val];
            default:
              return e.target[val].toString();
          }
        })()).trim();
      }
      if (key && (value != null)) {
        localStorage.setItem(key, value);
      }
      return e;
    };
  };

  denodeify = function(fn, thisArg) {
    return function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return new Promise(function(resolve, reject) {
        return fn.apply(thisArg, args.concat([
          (function() {
            var err, res, resArgs;
            err = arguments[0], resArgs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (err != null) {
              reject(err);
            }
            res = (function() {
              switch (resArgs.length) {
                case 0:
                  return true;
                case 1:
                  return resArgs[0];
                default:
                  return resArgs;
              }
            })();
            return resolve(res);
          })
        ]));
      });
    };
  };

  timeoutP = (function() {
    var err;
    err = new Error("Sorry it is taking an unusually long time to retrieve the data you requested. If you are not\nexperiencing the awesome in the next few seconds, retry your request or reload the page.\nSorry for any inconvenience.");
    return function(timeout, fn) {
      var func;
      if (timeout == null) {
        throw Error("Function timeoutP called with no timeout.");
      }
      func = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return new Promise(function(resolve, reject) {
          var promise, timer;
          promise = fn.apply(null, args);
          timer = setTimeout((function() {
            return reject(err);
          }), timeout);
          promise.then((function(val) {
            clearTimeout(testTimer);
            clearTimeout(timer);
            return resolve(val);
          }), (function(e) {
            clearTimeout(timer);
            clearTimeout(testTimer);
            return reject(e);
          }));
          return null;
        });
      };
      if (fn != null) {
        return func;
      } else {
        return function(fnArg) {
          return timeoutP(timeout, fnArg);
        };
      }
    };
  })();

  extern({
    setLocalStorage: setLocalStorage,
    onlyIf: onlyIf,
    timeoutP: timeoutP,
    debounce: debounce,
    throttle: throttle,
    denodeify: denodeify,
    log: log
  });

}).call(this);
