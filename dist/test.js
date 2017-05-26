(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['./decorators.js'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('./decorators.js'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.decorators);
    global.test = mod.exports;
  }
})(this, function (_decorators) {
  'use strict';

  var d = _interopRequireWildcard(_decorators);

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

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var add = function add(a, b) {
    return a + b;
  };

  var Foo = function Foo(a, b) {
    _classCallCheck(this, Foo);

    this.val = a + b;
  };

  ;

  var Bar = function Bar(a) {
    _classCallCheck(this, Bar);

    this.a = a;
  };

  describe('applyConstructor', function () {
    it('should allow the use of Function.prototype.apply with a class constructor.', function () {
      expect(d.applyConstructor(Foo, [1, 2]).val).toBe(3);
    });
  });

  describe('curry', function () {
    var curriedAdd = d.curry(add);
    it('should allow parameters to be applied individually.', function () {
      expect(curriedAdd(2)(3)).toBe(5);
    });

    it('should allow all the parameters to be supplied at once.', function () {
      expect(d.curry(add, 2, 3)).toBe(5);
    });

    it('should allow all the parameters to be supplied in chunks.', function () {
      expect(curriedAdd(2, 3)).toBe(5);
    });

    it('should work for constructors.', function () {
      var curriedFoo = d.curry(Foo);
      expect(curriedFoo(1)(2).val).toBe(3);
    });

    it('should itself be able to be partially applied.', function () {
      var curry2 = d.curry(2);
      var plus = curry2(add);
      expect(plus(2)(3)).toBe(5);
    });

    it('should use the context at the time the curried function is called.', function () {
      Bar.prototype.add2 = d.curry(function (b, c) {
        return this.a + b + c;
      })(2);
      expect(new Bar(1).add2(3)).toBe(6);
    });

    it('should throw on unknown args.', function () {
      expect(function () {
        return d.curry(true, 'foobar');
      }).toThrow();
    });

    it('should work for applyConstructor', function () {
      var appDate = d.applyConstructor(Date);
      expect(appDate([2014, 1, 1]).getTime()).toBe(new Date(2014, 1, 1).getTime());
    });
  });

  describe('apply', function () {
    it('should allow a function with positional arguments to be supplied an array.', function () {
      expect(d.apply(add, [1, 2])).toBe(3);
    });

    it('should use the context at the time the function is called.', function () {
      var obj = {
        a: 1,
        add: d.apply(function (b, c) {
          return this.a + b + c;
        })
      };

      expect(obj.add([2, 3])).toBe(6);
    });
  });

  describe('pipe', function () {
    it('should allow forward function composition.', function () {
      var add2 = d.curry(add, 2);
      var multiply3 = function multiply3(n) {
        return n * 3;
      };
      var addThenMult = d.pipe(add2, multiply3);
      expect(addThenMult(0)).toBe(6);
    });

    it('should use the context of the piped call throughout.', function () {
      var obj = {
        a: null,
        fn: d.pipe(function (n) {
          this.a = n + 2;
        }, function () {
          this.a *= 3;
        })
      };
      obj.fn(0);
      expect(obj.a).toBe(6);
    });
  });

  describe('debounce', function () {
    it('should drop calls repeated in the waiting period', function (done) {
      var wait = d.curry(2, d.debounce)(10),
          counter = 0,
          f = wait(function () {
        return counter += 1;
      });
      var o = {
        num: 0,
        fn: d.debounce(10, function () {
          this.num += 1;
        })
      };
      f();
      f();
      f();
      o.fn();
      o.fn();
      o.fn();
      setTimeout(function () {
        expect(counter).toBe(1);
        expect(o.num).toBe(1);
        done();
      }, 12);
    });

    it('should have a leading-edge version', function (done) {
      var wait = d.curry(3, d.debounce)(10, true),
          counter = 0,
          f = wait(function () {
        return counter += 1;
      });
      var o = {
        num: 0,
        fn: d.debounce(10, true, function () {
          this.num += 1;
        })
      };
      f();
      f();
      f();
      o.fn();
      o.fn();
      o.fn();
      setTimeout(function () {
        expect(counter).toBe(1);
        expect(o.num).toBe(1);
        setTimeout(function () {
          f();
          o.fn();
          expect(counter).toBe(2);
          expect(o.num).toBe(2);
          done();
        }, 4);
      }, 8);
    });
  });

  describe('throttle', function () {
    it('should not fire again until after the waiting period', function (done) {
      var wait = d.throttle(10),
          counter = 0,
          f = wait(function () {
        return counter += 1;
      });
      var o = {
        num: 0,
        fn: d.throttle(10, function () {
          this.num += 1;
        })
      };
      f();
      o.fn();
      setTimeout(f, 5); //should be delayed
      setTimeout(function () {
        return o.fn();
      }, 5); //should be delayed
      setTimeout(function () {
        expect(counter).toBe(1);
        expect(o.num).toBe(1);
      }, 8);
      setTimeout(function () {
        expect(counter).toBe(2);
        expect(o.num).toBe(2);
        done();
      }, 20);
    });
  });

  describe('bindArity', function () {
    var boo = function boo(a, b, c) {
      return [a, b, c].toString();
    };

    it('should return a function that only receives n arguments', function () {
      expect(d.bindArity(2, boo)(1, 2, 3)).toBe('1,2,');
    });

    it('should use the context.', function () {
      var obj = {
        a: 1,
        yo: d.bindArity(1, function (b, c) {
          return [this.a, b, c].toString();
        })
      };

      expect(obj.yo(2, 3)).toBe('1,2,');
    });
  });

  describe('trampoline', function () {
    var factorial = function factorial(n) {
      var _factorial = d.trampoline(function myself(acc, n) {
        return n ? function () {
          return myself(acc * n, n - 1);
        } : acc;
      });

      return _factorial(1, n);
    };

    it('should use bounded stack space to run thunk-returning tail-recursive fns', function () {
      expect(factorial(32000)).toBe(Infinity);
    });

    // TODO: test this
    // it('should use the context.', () => {
    //
    // });
  });

  describe('denodeify', function () {
    it('should turn a callback-accepting function into a promise returning one', function (done) {
      var passes = d.denodeify(function (a, b, cb) {
        return cb(null, a + b);
      })(4, 5);
      var fails = d.denodeify(function (cb) {
        return cb(new Error());
      })();
      var multi = d.denodeify(function (a, b, cb) {
        return cb(null, a, b);
      })(1, 2);

      passes.then(function (v) {
        expect(v).toBe(9);
        //return fails;
        done();
      }).then(null, function (e) {
        expect(e instanceof Error).toBe(true);
        return multi;
      }).then(function (v) {
        var _v = _slicedToArray(v, 2),
            a = _v[0],
            b = _v[1];

        expect(a).toBe(1);
        expect(b).toBe(2);
        done();
      });
    });

    it('should preserve ctx for methods', function (done) {
      var o = {
        a: 3,
        fn: d.denodeify(function (cb) {
          cb(null, this.a);
        })
      };
      o.fn().then(function (v) {
        expect(v).toBe(3);
        done();
      });
    });
  });

  describe('memoize', function () {
    it('should avoid recomputing.', function (done) {
      var f = d.memoize(function (a, b) {
        return new Promise(function (res) {
          setTimeout(function (_) {
            res(a + b);
          }, 10);
        });
      });

      f(2, 3).catch(function (err) {
        return console.log(err);
      });
      setTimeout(function (_) {
        var timeout = setTimeout(function (_) {
          expect(false).toBe(true);
          done();
        }, 5);
        var p = f(2, 3);
        p.then(function (val) {
          expect(val).toBe(5);
          done();
        }).catch(function (err) {
          return console.log(err);
        });
      }, 12);
    });
  });

  describe('maybe', function () {
    it('should return null if any the arguments are null or undefined', function () {
      var f = d.maybe(add);
      expect(f(null, 3)).toBe(null);
    });

    it('should have a loose mode where it returns null only if *all* arguments are null/undefined', function () {
      var canHaveNull = d.maybe(function (a, b) {
        return b;
      }, false);
      expect(canHaveNull(null, 3)).toBe(3);
    });

    it('should work for arity 0 functions irregardless', function () {
      var yields3 = d.maybe(function () {
        return 3;
      });
      expect(yields3()).toBe(3);
    });

    it('should preserve ctx for methods', function () {
      var obj = {
        a: 1,
        fn: d.maybe(function (b) {
          return this.a + b;
        })
      };

      expect(obj.fn(null)).toBe(null);
      expect(obj.fn(5)).toBe(6);
    });
  });

  describe('bindPromise', function () {
    it('should turn a normal function into a Promise-accepting one.', function (done) {
      var add3 = d.curry(add, 3);
      d.bindPromise(add3)(Promise.resolve(2)).then(function (val) {
        expect(val).toBe(5);
        done();
      });
    });

    it('should preserve ctx for methods', function (done) {
      var obj = {
        a: 1,
        fn: d.bindPromise(function (b) {
          return this.a + b;
        })
      };

      obj.fn(Promise.resolve(2)).then(function (val) {
        expect(val).toBe(3);
        done();
      });
    });
  });
});
