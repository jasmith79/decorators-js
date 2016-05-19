(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['./decorators.js', 'js-typed'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('./decorators.js'), require('js-typed'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.decorators, global.jsTyped);
    global.test = mod.exports;
  }
})(this, function (_decorators, _jsTyped) {
  'use strict';

  var d = _interopRequireWildcard(_decorators);

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

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

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

  //Some tests require a browser, so....
  var WORKER = 'function' === typeof Worker && 'undefined' !== typeof URL;
  var LOCAL_STORE = 'undefined' !== typeof localStorage;

  //needed for multiple tests
  var sum = function sum(a, b, c) {
    return a + b + c;
  };
  var noop = function noop() {};
  var identity = function identity(x) {
    return x;
  };
  var makeDate = typed.guardClass(0, Date);
  var dateArray = [2015, 0, 1, 12, 0, 0, 0];
  var jan1 = makeDate.apply(undefined, dateArray);
  var fortytwo = function fortytwo() {
    return 42;
  };

  var Foo = function Foo() {
    _classCallCheck(this, Foo);
  };

  ;

  var Bar = function (_Foo) {
    _inherits(Bar, _Foo);

    function Bar() {
      _classCallCheck(this, Bar);

      return _possibleConstructorReturn(this, Object.getPrototypeOf(Bar).apply(this, arguments));
    }

    return Bar;
  }(Foo);

  ;
  function factorial(n) {
    var _factorial = d.trampoline(function myself(acc, n) {
      return n ? function () {
        return myself(acc * n, n - 1);
      } : acc;
    });

    return _factorial(1, n);
  }

  /*   phantomjs polyfill whatnot   */
  var SYMBOL = 'undefined' !== typeof Symbol;
  if (!SYMBOL) {
    _global.Symbol = function _Symbol(str) {
      return {
        _value: str,
        toString: function toString() {
          return this._value;
        }
      };
    };
  }
  Number.isNaN = Number.isNaN || function (x) {
    return x !== x;
  };

  // describe('curry', function() {
  //  it('should let arguments be passed in multiple calls', function() {
  //    let fn = d.curry(sum);
  //    expect(fn(1,2,3)).toBe(6);
  //    expect(fn(1,2)(3)).toBe(6);
  //    expect(fn(1)(2)(3)).toBe(6);
  //    expect(fn('a','b','c')).toBe('abc');
  //    expect(fn('a','b')('c')).toBe('abc');
  //    expect(fn('a')('b')('c')).toBe('abc');
  //  });
  //
  //  it('should preserve ctx for methods', function() {
  //    let o = {
  //      a: 3,
  //      fn: d.curry(function(b, c) {
  //        return this.a + b + c;
  //      })
  //    };
  //    expect(o.fn(1,2)).toBe(6);
  //    expect(o.fn(1)(2)).toBe(6);
  //  });
  //
  //  it('should preserve the correct arity', function() {
  //    let curr = d.curry(sum);
  //    expect(curr.arity()).toBe(3);
  //    expect(curr(1).arity()).toBe(2);
  //    expect(curr(1, 2).arity()).toBe(1);
  //    expect((curr(1)(2)).arity()).toBe(1);
  //  })
  // });
  //
  // describe('typeGuard', function() {
  //   it('should work for all 7 basic types', function() {
  //     let string  = d.typeGuard('string',    identity);
  //     let number  = d.typeGuard('number',    identity);
  //     let func    = d.typeGuard('function',  identity);
  //     let object  = d.typeGuard('object',    identity);
  //     let undef   = d.typeGuard('undefined', identity);
  //     let boolean = d.typeGuard('boolean',   identity);
  //     let o       = {};
  //     expect(string('a')).toBe('a');
  //     expect((() => string(3))).toThrowError(TypeError);
  //     expect(number(3)).toBe(3);
  //     expect((() => number('a'))).toThrowError(TypeError);
  //     expect(func(identity)).toBe(identity);
  //     expect((() => func(3))).toThrowError(TypeError);
  //     expect(object(o)).toBe(o);
  //     expect((() => object(3))).toThrowError(TypeError);
  //     expect(undef(undefined)).toBe(undefined);
  //     expect((() => undef(null))).toThrowError(TypeError);
  //     expect(boolean(true)).toBe(true);
  //     expect((() => boolean(null))).toThrowError(TypeError);
  //     if (SYMBOL) {
  //       let symbol  = d.typeGuard('symbol',    identity);
  //       let sym     = Symbol('sym');
  //       expect(symbol(sym)).toBe(sym);
  //       expect((() => symbol('sym'))).toThrowError(TypeError);
  //     } else {
  //       console.log('skipping Symbol tests');
  //     }
  //   });
  //
  //   it('should work for instances of constructors custom and builtin ctor/literals', function() {
  //
  //     //internal class
  //     let array     = d.typeGuard('Array',  identity);
  //     let regexp    = d.typeGuard('regexp', identity); //testing case-insensitivity
  //     let date      = d.typeGuard('Date',   identity);
  //     let error     = d.typeGuard('Error',  identity);
  //
  //     //instanceof
  //     let fnArray   = d.typeGuard(Array,    identity);
  //     let fnRegExp  = d.typeGuard(RegExp,   identity);
  //     let fnDate    = d.typeGuard('Date',   identity); //strings too
  //     let foo       = new Foo();
  //     let isFoo     = d.typeGuard(Foo, identity);
  //     let reg       = /arstast/gmi;
  //     let arr       = [];
  //     let now       = new Date();
  //     let barr      = new Bar();
  //
  //     //duck-types
  //     let otherFoo  = d.typeGuard(new Bar(), identity);
  //     let otherArr  = d.typeGuard([], identity);
  //
  //     expect(array(arr)).toBe(arr);
  //     expect((() => array({}))).toThrowError(TypeError);
  //     expect(fnArray(arr)).toBe(arr);
  //     expect((() => fnArray({}))).toThrowError(TypeError);
  //     expect(regexp(reg)).toBe(reg);
  //     expect((() => regexp({}))).toThrowError(TypeError);
  //     expect(fnRegExp(reg)).toBe(reg);
  //     expect((() => fnRegExp({}))).toThrowError(TypeError);
  //     expect(date(now)).toBe(now);
  //     expect((() => date({}))).toThrowError(TypeError);
  //     expect(fnDate(now)).toBe(now);
  //     expect((() => fnDate({}))).toThrowError(TypeError);
  //     expect(isFoo(foo)).toBe(foo);
  //     expect(isFoo(barr)).toBe(barr);
  //     expect((() => isFoo({}))).toThrowError(TypeError);
  //     expect(otherFoo(barr)).toBe(barr);
  //     expect(() => otherFoo({})).toThrowError(TypeError);
  //     expect(otherArr(arr)).toBe(arr);
  //     expect(() => otherArr({})).toThrowError(TypeError);
  //   });
  //
  //   it('should work for builtin namespace objects like Math', function() {
  //     let math = d.typeGuard('Math', identity);
  //     expect(math(Math)).toBe(Math);
  //     expect((() => math(null))).toThrowError(TypeError);
  //   });
  //
  //   it('should work properly for null, "null", and "Null"', function() {
  //     let nulled = d.typeGuard(null, identity);
  //     let anull  = d.typeGuard('Null', identity);
  //     expect(nulled(null)).toBeNull();
  //     expect(anull(null)).toBeNull();
  //     expect((() => nulled({}))).toThrowError(TypeError);
  //     expect((() => anull({}))).toThrowError(TypeError);
  //   });
  //
  //   it('should preserve ctx for methods', function() {
  //     let o = {
  //       a: 3,
  //       fn: d.typeGuard('number', function(b, c) { return this.a + b + c;})
  //     };
  //     expect(o.fn(1, 2)).toBe(6);
  //     expect(() => o.fn(null, 2)).toThrowError(TypeError);
  //   });
  //
  //   it('should handle polymorphic functions', function() {
  //     let poly = d.typeGuard(['string', Date], (a) => {
  //       switch (true) {
  //         case ('string' === typeof a):
  //           return 3;
  //         case (a instanceof Date):
  //           return 5;
  //       }
  //     });
  //     expect(poly('a')).toBe(3);
  //     expect(poly(new Date())).toBe(5);
  //     expect(() => poly(42)).toThrowError(TypeError);
  //   })
  // });

  describe('unGather', function () {
    it('should conditionally unnest an array argument', function () {
      var f = d.unGather(function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var car = args[0];
        var cdr = args.slice(1);

        return Array.isArray(car) && cdr[0] === 3;
      });
      var fn = d.unGather(function () {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        return args.length > 1 ? fn(args.slice(1)) : args[0];
      });
      expect(f([1, 2], 3)).toBe(true);
      expect(fn(1, 2, 3)).toBe(3);
      expect(fn([1, 2, 3])).toBe(3);
      expect(fn(3)).toBe(3);
    });

    it('should preserve ctx for methods', function () {
      var o = {
        a: 3,
        fn: d.unGather(function () {
          for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }

          var b = args[0];
          var c = args[1];

          return this.a + b + c;
        })
      };
      expect(o.fn(1, 2)).toBe(6);
      expect(o.fn([1, 2])).toBe(6);
    });
  });

  describe('maybe', function () {
    it('should return null if any arguments are null or undefined except for arity 0', function () {
      var always = d.maybe(noop);
      var maySum = d.maybe(sum);
      expect(maySum(1, 2, 3)).toBe(6);
      expect(always()).toBeUndefined();
      expect(maySum(1, 2, null)).toBeNull();
    });

    it('should preserve ctx for methods', function () {
      var o = {
        a: 3,
        fn: d.maybe(function (b, c) {
          return this.a + b + c;
        })
      };
      expect(o.fn(null, 2)).toBeNull();
      expect(o.fn(1, 2)).toBe(6);
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

  describe('debounce', function () {
    it('should drop calls repeated in the waiting period', function (done) {
      var wait = d.debounce(10),
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
      var wait = d.debounce(10, true),
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
        return fails;
      }).then(null, function (e) {
        expect(e instanceof Error).toBe(true);
        return multi;
      }).then(function (v) {
        var _v = _slicedToArray(v, 2);

        var a = _v[0];
        var b = _v[1];

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

  describe('trampoline', function () {
    it('should use bounded stack space to run thunk-returning tail-recursive fns', function () {
      expect(factorial(32000)).toBe(Infinity);
    });
  });

  // describe('unNew', function() {
  //   let now  = makeDate();
  //   let also = new Date();
  //
  //   it('should allow a constructor function to be curried/applied/called', function() {
  //     expect(jan1.getFullYear()).toBe(2015);
  //     expect(jan1.getMonth()).toBe(0);
  //     expect(jan1.getDate()).toBe(1);
  //     expect(jan1.getHours()).toBe(12);
  //     expect(jan1.getMinutes()).toBe(0);
  //     expect(jan1.getSeconds()).toBe(0);
  //     expect(Math.abs(also.getTime() - now.getTime())).toBeLessThan(500);
  //   });
  //
  //   it('should not break instanceof', function() {
  //     let makeBar = d.unNew(Bar);
  //     let bar = makeBar();
  //     expect(jan1 instanceof Date).toBe(true);
  //     expect(bar instanceof Foo).toBe(true);
  //   });
  // });

  // describe('lift', function() {
  //   it('should wrap the return value in the passed in constructor', function() {
  //     let liftD = d.lift((...args) => {
  //       switch (true) {
  //         case !args.length:
  //         case args.length === 1 && args[0] == null:
  //           return makeDate();
  //         default: return makeDate(...args);
  //       }
  //     });
  //     let now = new Date();
  //     let later = liftD(() => {})();
  //     let t1 = now.getTime();
  //     let t2 = later.getTime();
  //     if (Number.isNaN(t2)) {
  //       throw new Error(`${later.toString()} is not a valid date`);
  //     }
  //     expect(later instanceof Date).toBe(true);
  //     expect(Math.abs(t2 - t1)).toBeLessThan(500);
  //     let also = liftD(() => {
  //       let arr = [
  //         later.getFullYear(),
  //         later.getMonth(),
  //         later.getDate(),
  //         later.getHours(),
  //         later.getMinutes(),
  //         later.getSeconds()
  //       ];
  //       console.log(`\nArr: ${arr}\n`);
  //       return arr;
  //     })();
  //     console.log(`\n${also.toString()}\n`);
  //     expect(Math.abs(also.getTime() - later.getTime())).toBeLessThan(1000);
  //   })
  // })
  //
  // describe('liftP', function() {
  //   it('should turn a function into a promise-returning fn', function(done) {
  //     let p = d.liftP(fortytwo)();
  //     p.then((v) => {
  //       expect(v).toBe(42);
  //       done();
  //     });
  //   });
  // });
  //
  // describe('liftA', function() {
  //   let arr = d.liftA(fortytwo)();
  //   it('should turn a function into a array-returning fn', function() {
  //     expect(arr.length).toBe(1);
  //     expect(arr[0]).toBe(42);
  //   });
  //
  //   it('should auto-flatten', function() {
  //     let returnsArray = () => [3];
  //     let val = d.liftA(returnsArray)();
  //     expect(val[0]).toBe(3);
  //   });
  // });

  describe('bindP', function () {
    it('should turn a -> a into Promise a -> Promise a', function (done) {
      var nine = d.bindP(function (n) {
        return n * 3;
      })(Promise.resolve(3));
      nine.then(function (v) {
        expect(v).toBe(9);
        done();
      });
    });
  });

  describe('loopP', function () {
    it('should loop a promise until the returned fn is called', function (done) {
      var counter = 0,
          fn = function fn() {
        counter += 1;
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            return resolve(3);
          }, 100);
        });
      };
      var fin = d.loopP(fn);
      setTimeout(function () {
        var p = fin();
        p.then(function (value) {
          expect(value).toBe(3);
          expect(counter).toBeGreaterThan(3);
          expect(counter).toBeLessThan(6);
          done();
        });
      }, 500);
    });

    it('should be capable of recursion', function (done) {
      var counter = 0;
      var padd = function padd(n) {
        counter += 1;
        return Promise.resolve(n + counter);
      };
      var fin = d.loopP(padd, 0);
      setTimeout(function () {
        fin().then(function (v) {
          var tally = 0;
          for (var i = 1; i <= counter; ++i) {
            tally += i;
          }
          expect(v).toBe(tally);
          done();
        });
      }, 5);
    });
  });

  describe('timeoutP', function () {
    it('should reject a promise that takes too long to resolve', function (done) {
      var timeout = 100,
          fn = function fn() {
        return Promise.resolve(3);
      };
      var fail = function fail() {
        return new Promise(function (res, rej) {
          setTimeout(function () {
            return res(3);
          }, 200);
        });
      };
      var tre = d.timeoutP(timeout, fn)();
      var uhoh = d.timeoutP(timeout, fail)();
      tre.then(function (v) {
        return expect(v).toBe(3);
      });
      uhoh.catch(function (e) {
        return expect(e instanceof Error).toBe(true);
      });
      Promise.all([tre, uhoh]).then(function () {
        return done();
      }).catch(function () {
        return done();
      });
    });
  });

  describe('padInt', function () {
    it('should pad the result of the passed in function with zeros', function () {
      var gd = jan1.getDate.bind(jan1);
      var oh_one = d.padInt(gd)();
      var ooh_one = d.padInt(3, gd)();
      expect(oh_one).toBe('01');
      expect(ooh_one).toBe('001');
    });

    it('can be used as a standalone function', function () {
      var date = jan1.getDate();
      var oh_one = d.padInt(2, date);
      var ooh_one = d.padInt(3, date);
      var ten = d.padInt(function () {
        return 10;
      })();
      expect(oh_one).toBe('01');
      expect(ooh_one).toBe('001');
      expect(ten).toBe('10');
    });

    it('should preserve ctx', function () {
      var obj = new Foo();
      obj.getNum = d.padInt(3, function () {
        return 2;
      });
      expect(obj.getNum()).toBe('002');
    });
  });

  describe('bindA', function () {
    it('should take a function of n arguments and return a function that takes an array of length n', function () {
      var arred = d.bindA(sum);
      expect(arred([1, 2, 3])[0]).toBe(6);
    });

    it('should preserve ctx', function () {
      var o = {
        a: 3,
        fn: d.bindA(function (b, c) {
          return this.a + b + c;
        })
      };
      expect(o.fn([1, 2])[0]).toBe(6);
    });
  });

  /*   Platform-specific tests   */

  if (LOCAL_STORE) {
    describe('setLocalStorage', function () {
      it('should store the currentTargets info in localStorage for handlers', function () {
        var el = document.createElement('input');
        el.label = 'foo';
        el.value = 'bar';
        el.addEventListener('click', d.setLocalStorage(function (e) {}));
        el.dispatchEvent(new Event('click'));
        expect(localStorage.getItem('foo')).toBe('bar');
      });

      it('should work with custom keys/values', function () {
        var el = document.createElement('div');
        el.baz = 'baz';
        el.qux = 'qux';
        el.addEventListener('change', d.setLocalStorage('baz', 'qux', function (e) {}));
        el.dispatchEvent(new Event('change'));
        expect(localStorage.getItem('baz')).toBe('qux');
      });

      it('should work for any of the following type signatures', function () {
        //setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event), covered above
        //setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
        //setLocalStorage :: (Event -> *) -> (Event -> Event), covered above
        var el = document.createElement('div');
        el.val = 'imaval';
        el.label = 'imakey';
        el.addEventListener('keydown', d.setLocalStorage('val', function (e) {}));
        el.dispatchEvent(new Event('keydown'));
        expect(localStorage.getItem('imakey')).toBe('imaval');
      });

      it('should use the result of the event handler if val is null', function () {
        var el = document.createElement('div');
        el.label = 'yo';
        el.value = 'mamasofat';
        el.addEventListener('click', d.setLocalStorage(null, function (e) {
          return 12;
        }));
        el.dispatchEvent(new Event('click'));
        expect(localStorage.getItem('yo')).toBe('12');
      });
    });
  } else {
    console.log('skipping localStorage test');
  }

  if (WORKER) {
    describe('parallelize', function () {
      it('should run a function in a separate thread', function (done) {
        var errHandle = function errHandle(e) {
          expect('I failed').toBe(true);
          done();
        };
        var parSum = d.timeoutP(500, d.parallelize(function (arg) {
          return arg.reduce(function (a, b) {
            return a + b;
          }, 0);
        }));
        var result = parSum(1, 2, 3);
        result.then(function (v) {
          expect(v).toBe(6);
          done();
        }).catch(errHandle);
      });

      it('should reject appropriately on error', function (done) {
        var throws = d.parallelize(function (arg) {
          return arg[0].foo();
        });
        var error = throws(6);
        error.then(function () {
          throw new Error('shouldnt see this');
        }).catch(function (e) {
          expect(e instanceof Error).toBe(true); //unnecessary really
          done();
        });
      });
    });
  } else {
    console.log('skipping Worker test');
  }
});
