
/*
Common decorators
@author Jared Smith
Remember to compile with the -b (bare) flag!
 */

(function() {
  var __slice = [].slice;

  (function(root, main) {
    var MOD_NAME;
    MOD_NAME = 'Decorators';
    switch (false) {
      case !((typeof module !== "undefined" && module !== null) && (module.exports != null)):
        return module.exports = main(root);
      case !(typeof define === 'function' && define.amd):
        return define(main.bind(root, root));
      default:
        return root[MOD_NAME] = main(root);
    }
  })((typeof window !== "undefined" && window !== null ? window : null), function(_global) {
    'use strict';
    var checkJSON, curry, debounce, denodeify, log, onlyIf, runTime, setLocalStorage, throttle, timeoutP, unGather, unNew, workerify, _getFnName, _invalidArgumentError, _isArray, _noGlobalCtx;
    _invalidArgumentError = new TypeError("Invalid argument");
    _getFnName = function(fn) {
      if (typeof fn !== 'function') {
        throw _invalidArgumentError;
      }
      if (fn.name != null) {
        return fn.name;
      } else {
        return fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1];
      }
    };
    _isArray = function(a) {
      return (Object.prototype.toString.call(a) === "[object Array]") || (a instanceof Array);
    };
    _noGlobalCtx = function(fn) {
      if (typeof fn !== 'function') {
        throw _invalidArgumentError;
      }
      return curry(fn.length, function() {
        var args, context;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        context = this === _global ? null : this;
        return fn.apply(context, args);
      });
    };
    curry = (function() {
      var _curry;
      _curry = function() {
        var args, fn;
        fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return function() {
          var fnArgs;
          fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return fn.apply(this, args.concat(fnArgs));
        };
      };
      curry = function(n, f) {
        var fn, length, _ref, _ref1;
        fn = null;
        length = 0;
        switch (false) {
          case f == null:
            if (typeof f !== 'function' || typeof n !== 'number') {
              throw _invalidArgumentError;
            }
            _ref = [f, n], fn = _ref[0], length = _ref[1];
            break;
          case typeof n !== 'function':
            _ref1 = [n, n.length], fn = _ref1[0], length = _ref1[1];
            break;
          case typeof n !== 'number':
            return function(fn) { return curry.call(this, n, fn); };
            break;
          default:
            throw _invalidArgumentError;
        }
        return function() {
          var concated, context, currLength, fnArgs, val;
          fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          context = this === _global ? null : this;
          if (fnArgs.length < length) {
            concated = [fn].concat(fnArgs);
            currLength = length - fnArgs.length;
            val = currLength > 0 ? curry(currLength, _curry.apply(context, concated)) : _curry.apply(context, concated);
            return val;
          } else {
            return fn.apply(context, fnArgs);
          }
        };
      };
      return curry;
    })();
    unGather = (function(_this) {
      return function() {
        var args, fn, func, initArgs;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        fn = args[0], initArgs = 2 <= args.length ? __slice.call(args, 1) : [];
        if (typeof fn !== 'function') {
          throw _invalidArgumentError;
        }
        func = _noGlobalCtx(function() {
          var fnArgs, params;
          fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          params = fnArgs.length === 1 && _isArray(fnArgs[0]) ? fnArgs[0] : fnArgs;
          return fn.apply(this, params);
        });
        if (initArgs.length) {
          return func.apply(_this, initArgs);
        } else {
          return func;
        }
      };
    })(this);
    onlyIf = function(fn) {
      if (typeof fn !== 'function') {
        throw _invalidArgumentError;
      }
      return _noGlobalCtx(unGather(function() {
        var args, passed;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        passed = fn.length && args.length === 0 ? false : args.every(function(x) {
          return x != null;
        });
        if (passed) {
          return fn.apply(this, args);
        } else {
          return null;
        }
      }));
    };
    debounce = curry(function(delay, fn) {
      var timer;
      timer = null;
      return _noGlobalCtx(function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        clearTimeout(timer);
        timer = setTimeout(((function(_this) {
          return function() {
            return fn.apply(_this, args);
          };
        })(this)), delay);
        return timer;
      });
    });
    throttle = curry(function(delay, fn) {
      var last, timer;
      last = null;
      timer = null;
      return _noGlobalCtx(function() {
        var args, now;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        now = Date.now();
        if ((last != null) && now < last + delay) {
          clearTimeout(timer);
          return timer = setTimeout(((function(_this) {
            return function() {
              last = now;
              return fn.apply(_this, args);
            };
          })(this)), delay);
        } else {
          last = now;
          return fn.apply(this, args);
        }
      });
    });
    log = function(fn) {
      return curry(fn.length, _noGlobalCtx(function() {
        var args, calledArgs, name, res, str;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        res = fn.apply(this, args);
        str = (function() {
          switch (typeof res) {
            case 'object':
              return JSON.stringify(res);
            case 'string':
              return res;
            default:
              return res.toString();
          }
        })();
        name = _getFnName(fn) || "Anonymous";
        calledArgs = args.length ? args : "none";
        console.log("Function " + name + " called with arguments " + calledArgs + " and yielded " + str);
        return res;
      }));
    };
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
        if (_isArray(result)) {
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
    denodeify = (function(_this) {
      return function(fn) {
        return _noGlobalCtx(function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return new Promise(function(resolve, reject) {
            return fn.apply(this, args.concat([
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
        });
      };
    })(this);
    timeoutP = (function() {
      var err;
      err = new Error("Sorry it is taking an unusually long time to retrieve the data you requested. If you are not\nexperiencing the awesome in the next few seconds, retry your request or reload the page.\nSorry for any inconvenience.");
      return (function(_this) {
        return function(timeout, fn) {
          var func;
          if (timeout == null) {
            throw new Error("Function timeoutP called with no timeout.");
          }
          func = function() {
            var args, context;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            context = this === _global ? null : this;
            return new Promise(function(resolve, reject) {
              var promise, timer;
              promise = fn.apply(context, args);
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
      })(this);
    })();
    workerify = function(fn) {
      var blob, url, worker;
      blob = new Blob(["onmessage = function(e) { postMessage((" + fn + ")(e)); })"]);
      url = URL.createURLObject(blob);
      worker = new Worker(url);
      URL.revokeURLObject(url);
      return function(arg) {
        worker.postMessage(arg);
        return new Promise(function(resolve, reject) {
          var listener;
          listener = function(e) {
            worker.removeEventListener('message', listener);
            return resolve(e.data);
          };
          return worker.addEventListener('message', listener);
        });
      };
    };
    unNew = function() {
      var args, constructor, func, initArgs;
      initArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      constructor = initArgs[0], args = 2 <= initArgs.length ? __slice.call(initArgs, 1) : [];
      if ((constructor == null) || typeof constructor !== 'function') {
        throw _invalidArgumentError;
      }
      func = function() {
        var fnArgs;
        fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return new (Function.prototype.bind.apply(constructor, [constructor].concat(fnArgs)));
      };
      if (args.length) {
        return func.apply(this, args);
      } else {
        return func;
      }
    };
    checkJSON = function(f) {
      var fn, _notJSONError;
      if (typeof f !== 'function') {
        throw _invalidArgumentError;
      }
      _notJSONError = new Error("Function " + (getFnName(f)) + " should return a valid JSON string");
      fn = ifOnly(_noGlobalCtx(f));
      return function() {
        var args, json;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        json = fn.apply(this, args);
        if (typeof json !== 'string') {
          throw _notJSONError;
        }
        switch (false) {
          case !(json.length < 3):
          case !!json[0].match(/[\[,\{,0-9,n,t,f]/i):
            return null;
          default:
            return JSON.parse(json);
        }
      };
    };
    runTime = function(f) {
      var fn;
      fn = log(f);
      return function() {
        var args, res;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        console.time(getFnName(f));
        res = fn.apply(this, args);
        console.timeEnd(getFnName(f));
        return res;
      };
    };
    return {
      setLocalStorage: setLocalStorage,
      onlyIf: onlyIf,
      timeoutP: timeoutP,
      debounce: debounce,
      throttle: throttle,
      denodeify: denodeify,
      log: log,
      workerify: workerify,
      unNew: unNew,
      unGather: unGather,
      checkJSON: checkJSON,
      runTime: runTime,
      curry: curry
    };
  });

}).call(this);
