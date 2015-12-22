
/*
Unit tests for decorators.js
 *@author Jared Smith, INDOT Web Application Developer
 */

(function() {
  var MOD_NAME, MOD_SYSTEM, assert, capFirst, catchHandler, d, extern, getFnName, include, padInt, _global;

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

  MOD_NAME = 'Test';

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

  catchHandler = function(err) {
    console.log(err);
    return null;
  };

  padInt = function(num) {
    if (num > 9) {
      return num.toString();
    } else {
      return '0' + num;
    }
  };

  capFirst = function(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
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


  /* Includes */

  d = include('../decorators.js', 'decorator');

  assert = require('assert');


  /* Tests */

  describe('onlyIf', function() {
    return it('should not run when some args are null/undefined, otherwise run', function() {
      var emptyOk, gives3, method, sideEffect;
      sideEffect = null;
      gives3 = d.onlyIf(function(a) {
        return 3;
      });
      emptyOk = d.onlyIf(function() {
        return 4;
      });
      method = {
        num: 3,
        add: d.onlyIf(function(n) {
          return n + this.num;
        })
      };
      assert.equal(3, gives3(15));
      assert.equal(3, gives3('foo'));
      assert.equal(3, gives3({}));
      assert.equal(null, gives3(null));
      assert.equal(null, gives3([null]));
      assert.equal(null, gives3([]));
      assert.equal(null, gives3());
      assert.equal(null, gives3(4, null));
      assert.equal(null, gives3(4, void 0));
      d.onlyIf(function() {
        return sideEffect = 2;
      })(null);
      assert.equal(null, sideEffect);
      assert.equal(null, emptyOk(null));
      assert.equal(4, emptyOk());
      assert.equal(7, method.add(4));
      return assert.equal(null, method.add());
    });
  });

  describe('setLocalStorage', function() {
    return it('should cache the result of an event handler in localStorage', function() {
      localStorage = {
       _store: {},
       getItem: function(k) { return this._store[k]; },
       setItem: function(k, v) {
         this._store[k] = v;
         return this;
       }
    };;
      var arrHandler, event, handler;
      handler = d.setLocalStorage(function(e) {
        return null;
      });
      arrHandler = d.setLocalStorage(function(e) {
        return [e.target.foo, e.target.bar];
      });
      event = {
        target: {
          foo: 'foo',
          bar: 3,
          label: 'qux',
          value: 5
        }
      };
      assert.equal(event, handler(event));
      assert.equal(5, localStorage.getItem('qux'));
      assert.equal(event, arrHandler(event));
      return assert.equal(3, localStorage.getItem('foo'));
    });
  });

  describe('throttle', function() {
    return it('should not fire again immediately in the waiting period', function(done) {
      var counter, f, onlyAfter500;
      onlyAfter500 = d.throttle(500);
      counter = 0;
      f = onlyAfter500(function() {
        return counter += 1;
      });
      f();
      setTimeout(f, 100);
      setTimeout((function() {
        return assert.equal(1, counter);
      }), 101);
      return setTimeout((function() {
        assert.equal(2, counter);
        return done();
      }), 1000);
    });
  });

  describe('debounce', function() {
    return it('Repeated invocations in the wait get dropped', function(done) {
      var counter, f, method, onlyAfter500;
      onlyAfter500 = d.debounce(500);
      counter = 0;
      f = onlyAfter500(function() {
        return counter += 1;
      });
      method = {
        num: 0,
        inc: d.debounce(500, function() {
          return this.num += 1;
        })
      };
      f();
      f();
      f();
      method.inc();
      method.inc();
      method.inc();
      return setTimeout((function() {
        assert.equal(1, counter);
        assert.equal(1, method.num);
        return done();
      }), 1000);
    });
  });

  describe('log', function() {
    return it('Should work for methods', function() {
      var obj;
      obj = {
        method: d.log(function() {
          return this;
        })
      };
      return assert.equal(obj, obj.method());
    });
  });

  describe('timeoutP', function() {
    return it('Should fail a promise if it takes longer than the timeout to resolve', function(done) {
      var fails, halfSecond, passes;
      halfSecond = d.timeoutP(200);
      passes = halfSecond(function() {
        return Promise.resolve(true);
      });
      fails = halfSecond(function() {
        return new Promise(function(resolve) {
          return setTimeout((function() {
            console.log('done');
            return resolve(true);
          }), 500);
        });
      });
      return passes().then(function(v) {
        assert.ok(v);
        return fails();
      }).then(null, function(e) {
        assert.ok(e instanceof Error);
        return done();
      });
    });
  });

  describe('denodeify', function() {
    return it('should turn a callback accepting fn into a promise returning one', function(done) {
      var fails, fn1, fn2, fn3, multi, passes;
      fn1 = function(one, two, cb) {
        return cb(null, one + two);
      };
      fn2 = function(cb) {
        return cb(new Error('some err'));
      };
      fn3 = function(one, two, cb) {
        return cb(null, one, two);
      };
      passes = d.denodeify(fn1)(4, 5);
      fails = d.denodeify(fn2)();
      multi = d.denodeify(fn3)(1, 2);
      return passes.then(function(v) {
        assert.equals(v, 9);
        return fails;
      }).then(null, function(e) {
        assert.ok(e instanceof Error);
        return multi;
      }).then(function(v) {
        var one, two;
        one = v[0], two = v[1];
        assert.equal(one, 1);
        assert.equal(two, 2);
        return done();
      });
    });
  });

  describe('unNew', function() {
    return it('Should allow a constructor function to be `apply`ed', function() {
      var allAtOnce, arr, dater, foo, januaryFirst2015, method, time1, time2;
      januaryFirst2015 = 1422766800000;
      arr = [2015, 1, 1];
      dater = d.unNew(Date);
      allAtOnce = d.unNew(Date, 2015, 1, 1);
      time1 = dater.apply(null, arr).getTime();
      time2 = allAtOnce.getTime();
      assert.equal(time1, januaryFirst2015);
      assert.equal(time2, januaryFirst2015);
      method = {
        Foo: function() {
          return this.a = 3;
        }
      };
      foo = d.unNew(method.Foo)();
      assert.ok(foo instanceof method.Foo);
      return assert.equal(foo.a, 3);
    });
  });

}).call(this);
