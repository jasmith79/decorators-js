
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
    var checkJSON, debounce, denodeify, getFnName, log, onlyIf, setLocalStorage, throttle, timeoutP, unGather, unNew, workerify;
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
    onlyIf = (function(_this) {
      return function(fn) {
        return function() {
          var args, context, passed, test;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          test = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
          passed = fn.length && test.length === 0 ? false : test.every(function(x) {
            return x != null;
          });
          context = this === _global ? null : this;
          if (passed) {
            return fn.apply(context, args);
          } else {
            return null;
          }
        };
      };
    })(this);
    debounce = (function(_this) {
      return function(delay, fn) {
        var func, timer;
        if (delay == null) {
          throw Error("Function debounce called with no timeout.");
        }
        timer = null;
        func = function() {
          var args, context;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          context = this === _global ? null : this;
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
    })(this);
    throttle = (function(_this) {
      return function(delay, fn) {
        var func, last, timer;
        if (delay == null) {
          throw Error("Function throttle called with no timeout.");
        }
        last = null;
        timer = null;
        func = function() {
          var args, context, now;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          context = this === _global ? null : this;
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
    })(this);
    log = (function(_this) {
      return function(fn) {
        return function() {
          var args, calledArgs, context, logged, name, res;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          context = this === _global ? null : this;
          res = fn.apply(context, args);
          logged = (function() {
            switch (typeof res) {
              case 'object':
                return JSON.stringify(res);
              case 'string':
                return res;
              default:
                return res.toString();
            }
          })();
          name = getFnName(fn) || "Anonymous";
          calledArgs = args.length ? args : "none";
          console.log("Function " + name + " called with arguments " + calledArgs + " and yielded " + res);
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
    denodeify = (function(_this) {
      return function(fn) {
        return function() {
          var args, context;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          context = this === _global ? null : this;
          return new Promise(function(resolve, reject) {
            return fn.apply(context, args.concat([
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
    unNew = (function() {
      var argErr;
      argErr = new Error("Invalid argument to function unNew");
      return function() {
        var args, constructor, func, initArgs;
        initArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        constructor = initArgs[0], args = 2 <= initArgs.length ? __slice.call(initArgs, 1) : [];
        if ((constructor == null) || typeof constructor !== 'function') {
          throw argErr;
        }
        func = function() {
          var fnArgs;
          fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return new (Function.prototype.bind.apply(constructor, [constructor].concat(fnArgs)));
        };
        if (args.length) {
          return func.apply(context, args);
        } else {
          return func;
        }
      };
    })();
    unGather = (function() {
      var argErr;
      argErr = new Error("Invalid argument to function applied");
      return (function(_this) {
        return function() {
          var args, fn, func, initArgs;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          fn = args[0], initArgs = 2 <= args.length ? __slice.call(args, 1) : [];
          if (typeof fn !== 'function') {
            throw argErr;
          }
          func = function() {
            var context, fnArgs, params;
            fnArgs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            context = this === _global ? null : this;
            params = fnArgs.length === 1 && Array.isArray(fnArgs[0]) ? fnArgs[0] : fnArgs;
            return fn.apply(context, params);
          };
          if (initArgs.length) {
            return func.apply(_this, initArgs);
          } else {
            return func;
          }
        };
      })(this);
    })();
    checkJSON = function(json) {
      switch (false) {
        case typeof json === 'string':
        case !(json.length < 3):
        case !json.match(/fail/i):
          return null;
        default:
          return JSON.parse(json);
      }
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
      checkJSON: checkJSON
    };
  });

}).call(this);
