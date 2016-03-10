/*
 * Tests for decorators.js.
 * @author Jared Smith, jasmith79@gmail.com;
 * @copyright Jared Smith, 2015
 * Licensed under the MIT license. You should have received a copy with this software, otherwise see
 * https://opensource.org/licenses/MIT.
 *
 */

import * as d from './decorators.js';

const _global = (() => {
  let window = window || null;
  let global = global || null;
  let self   = self   || null;
  return window || global || self;
});

//Some tests require a browser, so....
const WORKER = 'function' === typeof Worker && 'undefined' !== typeof URL;
const LOCAL_STORE = 'undefined' !== typeof localStorage;

//needed for multiple tests
let sum      = function(a,b,c) { return a + b + c; };
let noop     = function(){};
let identity = x => x;
let makeDate = d.unNew(0, Date);
let dateArray = [2015, 0, 1, 12, 0, 0, 0];
let jan1 = makeDate(...dateArray);
let fortytwo = () => 42;
class Foo {};
class Bar extends Foo {};
function factorial (n) {
  var _factorial = d.trampoline( function myself (acc, n) {
    return n
    ? function () { return myself(acc * n, n - 1); }
    : acc
  });

  return _factorial(1, n);
}

/*   phantomjs polyfill whatnot   */
const SYMBOL = 'undefined' !== typeof Symbol
if (!SYMBOL) {
  _global.Symbol = function Symbol(str) {
    return {
      _value: str,
      toString: function() { return this._value; }
    }
  };
}
Number.isNaN = Number.isNaN || function(x) {
  return x !== x;
}

describe('curry', function() {
 it('should let arguments be passed in multiple calls', function() {
   let fn = d.curry(sum);
   expect(fn(1,2,3)).toBe(6);
   expect(fn(1,2)(3)).toBe(6);
   expect(fn(1)(2)(3)).toBe(6);
   expect(fn('a','b','c')).toBe('abc');
   expect(fn('a','b')('c')).toBe('abc');
   expect(fn('a')('b')('c')).toBe('abc');
 });

 it('should preserve ctx for methods', function() {
   let o = {
     a: 3,
     fn: d.curry(function(b, c) {
       return this.a + b + c;
     })
   };
   expect(o.fn(1,2)).toBe(6);
   expect(o.fn(1)(2)).toBe(6);
 });
});

describe('typeGuard', function() {
  it('should work for all 7 basic types', function() {
    let string  = d.typeGuard('string',    identity);
    let number  = d.typeGuard('number',    identity);
    let func    = d.typeGuard('function',  identity);
    let object  = d.typeGuard('object',    identity);
    let undef   = d.typeGuard('undefined', identity);
    let boolean = d.typeGuard('boolean',   identity);
    let o       = {};
    expect(string('a')).toBe('a');
    expect((() => string(3))).toThrowError(TypeError);
    expect(number(3)).toBe(3);
    expect((() => number('a'))).toThrowError(TypeError);
    expect(func(identity)).toBe(identity);
    expect((() => func(3))).toThrowError(TypeError);
    expect(object(o)).toBe(o);
    expect((() => object(3))).toThrowError(TypeError);
    expect(undef(undefined)).toBe(undefined);
    expect((() => undef(null))).toThrowError(TypeError);
    expect(boolean(true)).toBe(true);
    expect((() => boolean(null))).toThrowError(TypeError);
    if (SYMBOL) {
      let symbol  = d.typeGuard('symbol',    identity);
      let sym     = Symbol('sym');
      expect(symbol(sym)).toBe(sym);
      expect((() => symbol('sym'))).toThrowError(TypeError);
    } else {
      console.log('skipping Symbol tests');
    }
  });

  it('should work for instances of constructors custom and builtin ctor/literals', function() {

    //internal class
    let array     = d.typeGuard('Array',  identity);
    let regexp    = d.typeGuard('regexp', identity); //testing case-insensitivity
    let date      = d.typeGuard('Date',   identity);
    let error     = d.typeGuard('Error',  identity);

    //instanceof
    let fnArray   = d.typeGuard(Array,    identity);
    let fnRegExp  = d.typeGuard(RegExp,   identity);
    let fnDate    = d.typeGuard('Date',   identity); //strings too
    let foo       = new Foo();
    let isFoo     = d.typeGuard(Foo, identity);
    let reg       = /arstast/gmi;
    let arr       = [];
    let now       = new Date();
    let barr      = new Bar();

    //duck-types
    let otherFoo  = d.typeGuard(new Bar(), identity);
    let otherArr  = d.typeGuard([], identity);

    expect(array(arr)).toBe(arr);
    expect((() => array({}))).toThrowError(TypeError);
    expect(fnArray(arr)).toBe(arr);
    expect((() => fnArray({}))).toThrowError(TypeError);
    expect(regexp(reg)).toBe(reg);
    expect((() => regexp({}))).toThrowError(TypeError);
    expect(fnRegExp(reg)).toBe(reg);
    expect((() => fnRegExp({}))).toThrowError(TypeError);
    expect(date(now)).toBe(now);
    expect((() => date({}))).toThrowError(TypeError);
    expect(fnDate(now)).toBe(now);
    expect((() => fnDate({}))).toThrowError(TypeError);
    expect(isFoo(foo)).toBe(foo);
    expect(isFoo(barr)).toBe(barr);
    expect((() => isFoo({}))).toThrowError(TypeError);
    expect(otherFoo(barr)).toBe(barr);
    expect(() => otherFoo({})).toThrowError(TypeError);
    expect(otherArr(arr)).toBe(arr);
    expect(() => otherArr({})).toThrowError(TypeError);
  });

  it('should work for builtin namespace objects like Math', function() {
    let math = d.typeGuard('Math', identity);
    expect(math(Math)).toBe(Math);
    expect((() => math(null))).toThrowError(TypeError);
  });

  it('should work properly for null, "null", and "Null"', function() {
    let nulled = d.typeGuard(null, identity);
    let anull  = d.typeGuard('Null', identity);
    expect(nulled(null)).toBeNull();
    expect(anull(null)).toBeNull();
    expect((() => nulled({}))).toThrowError(TypeError);
    expect((() => anull({}))).toThrowError(TypeError);
  });

  it('should preserve ctx for methods', function() {
    let o = {
      a: 3,
      fn: d.typeGuard('number', function(b, c) { return this.a + b + c;})
    };
    expect(o.fn(1, 2)).toBe(6);
    expect(() => o.fn(null, 2)).toThrowError(TypeError);
  });

  it('should handle polymorphic functions', function() {
    let poly = d.typeGuard(['string', Date], (a) => {
      switch (true) {
        case ('string' === typeof a):
          return 3;
        case (a instanceof Date):
          return 5;
      }
    });
    expect(poly('a')).toBe(3);
    expect(poly(new Date())).toBe(5);
    expect(() => poly(42)).toThrowError(TypeError);
  })
});

describe('unGather', function() {
  it('should conditionally unnest an array argument', function() {
    let f = d.unGather((...args) => {
      let [car, ...cdr] = args;
      return Array.isArray(car) && cdr[0] === 3;
    });
    let fn = d.unGather((...args) => args.length > 1 ? fn(args.slice(1)) : args[0]);
    expect(f([1,2], 3)).toBe(true);
    expect(fn(1,2,3)).toBe(3);
    expect(fn([1,2,3])).toBe(3);
    expect(fn(3)).toBe(3);
  });

  it('should preserve ctx for methods', function() {
    let o = {
      a: 3,
      fn: d.unGather(function(...args) {
        let [b, c] = args;
        return this.a + b + c;
      })
    };
    expect(o.fn(1,2)).toBe(6);
    expect(o.fn([1,2])).toBe(6);
  });
});

describe('maybe', function() {
  it('should return null if any arguments are null or undefined except for arity 0', function() {
    let always = d.maybe(noop);
    let maySum = d.maybe(sum);
    expect(maySum(1,2,3)).toBe(6);
    expect(always()).toBeUndefined();
    expect(maySum(1,2,null)).toBeNull();
  });

  it('should preserve ctx for methods', function() {
    let o = {
      a: 3,
      fn: d.maybe(function(b, c) { return this.a + b + c;})
    };
    expect(o.fn(null, 2)).toBeNull();
    expect(o.fn(1,2)).toBe(6);
  });
});

describe('throttle', function() {
  it('should not fire again until after the waiting period', function(done) {
    let halfsec = d.throttle(500), counter = 0, f = halfsec(() => counter += 1);
    let o = {
      num: 0,
      fn: d.throttle(500, function(){ this.num += 1; })
    };
    f();
    o.fn();
    setTimeout(f, 100);            //should be delayed
    setTimeout(() => o.fn(), 100); //should be delayed
    setTimeout(() => {
       expect(counter).toBe(1);
       expect(o.num).toBe(1);
    }, 200);
    setTimeout(() => {
      expect(counter).toBe(2);
      expect(o.num).toBe(2);
      done();
    }, 700);
  });
});

describe('debounce', function() {
  it('should drop calls repeated in the waiting period', function(done) {
    let halfsec = d.debounce(500), counter = 0, f = halfsec(() => counter += 1);
    let o = {
      num: 0,
      fn: d.debounce(500, function(){ this.num += 1; })
    };
    f();
    f();
    f();
    o.fn();
    o.fn();
    o.fn();
    setTimeout(() => {
      expect(counter).toBe(1);
      expect(o.num).toBe(1);
      setTimeout(() => {
        f();
        o.fn();
        expect(counter).toBe(2);
        expect(o.num).toBe(2);
        done();
      }, 200)
    }, 400);
  });
});

describe('denodeify', function() {
  it('should turn a callback-accepting function into a promise returning one', function(done) {
    let passes = d.denodeify((a, b, cb) => cb(null, a + b))(4,5);
    let fails  = d.denodeify((cb) => cb(new Error()))();
    let multi  = d.denodeify((a, b, cb) => cb(null, a, b))(1,2);

    passes
      .then((v) => {
        expect(v).toBe(9);
        return fails;
      })
      .then(null, (e) => {
        expect(e instanceof Error).toBe(true);
        return multi;
      })
      .then((v) => {
        let [a, b] = v;
        expect(a).toBe(1);
        expect(b).toBe(2);
        done();
      });
  });

  it('should preserve ctx for methods', function(done) {
    let o = {
      a: 3,
      fn: d.denodeify(function(cb) { cb(null, this.a); })
    };
    o.fn().then((v) => {
      expect(v).toBe(3);
      done();
    });
  });
});

describe('trampoline', function() {
  it('should use bounded stack space to run thunk-returning tail-recursive fns', function() {
    expect(factorial(32000)).toBe(Infinity);
  });
});

describe('unNew', function() {
  let now  = makeDate();
  let also = new Date();

  it('should allow a constructor function to be curried/applied/called', function() {
    expect(jan1.getFullYear()).toBe(2015);
    expect(jan1.getMonth()).toBe(0);
    expect(jan1.getDate()).toBe(1);
    expect(jan1.getHours()).toBe(12);
    expect(jan1.getMinutes()).toBe(0);
    expect(jan1.getSeconds()).toBe(0);
    expect(Math.abs(also.getTime() - now.getTime())).toBeLessThan(500);
  });

  it('should not break instanceof', function() {
    let makeBar = d.unNew(Bar);
    let bar = makeBar();
    expect(jan1 instanceof Date).toBe(true);
    expect(bar instanceof Foo).toBe(true);
  });
});

describe('lift', function() {
  it('should wrap the return value in the passed in constructor', function() {
    let liftD = d.lift((...args) => {
      return makeDate(...args)
    });
    let now = new Date();
    let later = liftD(() => {})();
    let t1 = now.getTime();
    let t2 = later.getTime();
    if (Number.isNaN(t2)) {
      throw new Error(`${later.toString()} is not a valid date`);
    }
    expect(later instanceof Date).toBe(true);
    expect(Math.abs(t2 - t1)).toBeLessThan(500);
    let also = liftD(() => {
      return [
        later.getFullYear(),
        later.getMonth(),
        later.getDate(),
        later.getHours(),
        later.getMinutes(),
        later.getSeconds()
      ]
    })();
    expect(Math.abs(also.getTime() - later.getTime())).toBeLessThan(1000);
  })
})

describe('liftP', function() {
  it('should turn a function into a promise-returning fn', function(done) {
    let p = d.liftP(fortytwo)();
    p.then((v) => {
      expect(v).toBe(42);
      done();
    });
  });
});

describe('liftA', function() {
  let arr = d.liftA(fortytwo)();
  it('should turn a function into a array-returning fn', function() {
    expect(arr.length).toBe(1);
    expect(arr[0]).toBe(42);
  });

  it('should auto-flatten', function() {
    let returnsArray = () => [3];
    let val = d.liftA(returnsArray)();
    expect(val[0]).toBe(3);
  });
});

describe('bindP', function() {
  it('should turn a -> a into Promise a -> Promise a', function(done) {
    let nine = d.bindP((n) => n * 3)(Promise.resolve(3));
    nine.then((v) => {
      expect(v).toBe(9);
      done();
    });
  });
});

describe('loopP', function() {
  it('should loop a promise until the returned fn is called', function(done) {
    let counter = 0, fn = () => {
      counter += 1;
      return new Promise((resolve, reject) => {
        setTimeout(() => resolve(3), 100);
      });
    };
    let fin = d.loopP(fn);
    setTimeout(() => {
      let p = fin();
      p.then((value) => {
        expect(value).toBe(3);
        expect(counter).toBeGreaterThan(3);
        expect(counter).toBeLessThan(6);
        done();
      });
    }, 500);
  });

  it('should be capable of recursion', function(done) {
    let counter = 0
    let padd = d.liftP((n) => {
      counter += 1;
      return n + counter;
    });
    let fin = d.loopP(padd, 0);
    setTimeout(() => {
      fin().then((v) => {
        let tally = 0;
        for (let i=1; i <= counter; ++i) {
          tally += i;
        }
        expect(v).toBe(tally);
        done();
      });
    }, 5);
  });
});

describe('timeoutP', function() {
  it('should reject a promise that takes too long to resolve', function(done) {
    let timeout = 100, fn = d.liftP(() => 3);
    let fail = () => new Promise((res, rej) => {
      setTimeout(() => res(3), 200);
    });
    let tre = d.timeoutP(timeout, fn)();
    let uhoh = d.timeoutP(timeout, fail)();
    tre.then((v) => expect(v).toBe(3));
    uhoh.catch((e) => expect(e instanceof Error).toBe(true));
    Promise.all([tre, uhoh]).then(() => done()).catch(() => done());
  });
});

describe('padInt', function() {
  it('should pad the result of the passed in function with zeros', function() {
    let gd = jan1.getDate.bind(jan1);
    let oh_one = d.padInt(gd)();
    let ooh_one = d.padInt(3, gd)();
    expect(oh_one).toBe('01');
    expect(ooh_one).toBe('001');
  });

  it('can be used as a standalone function', function() {
    let date = jan1.getDate();
    let oh_one = d.padInt(2, date);
    let ooh_one = d.padInt(3, date);
    let ten = d.padInt(() => 10)();
    expect(oh_one).toBe('01');
    expect(ooh_one).toBe('001');
    expect(ten).toBe('10')
  });

  it('should preserve ctx', function() {
    let obj = new Foo();
    obj.getNum = d.padInt(3, function() {
      return 2;
    });
    expect(obj.getNum()).toBe('002');
  });
});

describe('bindA', function() {
  it('should take a function of n arguments and return a function that takes an array of length n',
    function() {
      let arred = d.bindA(sum);
      expect(arred([1,2,3])[0]).toBe(6);
    }
  );

  it('should preserve ctx', function() {
    let o = {
      a: 3,
      fn: d.bindA(function(b, c) {
        return this.a + b + c;
      })
    };
    expect(o.fn([1,2])[0]).toBe(6);
  });
});

/*   Platform-specific tests   */

if (LOCAL_STORE) {
  describe('setLocalStorage', function() {
    it('should store the currentTargets info in localStorage for handlers', function() {
      let el = document.createElement('input');
      el.label = 'foo';
      el.value = 'bar';
      el.addEventListener('click', d.setLocalStorage((e) => {}));
      el.dispatchEvent(new Event('click'));
      expect(localStorage.getItem('foo')).toBe('bar');
    });

    it('should work with custom keys/values', function() {
      let el = document.createElement('div');
      el.baz = 'baz';
      el.qux = 'qux';
      el.addEventListener('change', d.setLocalStorage('baz', 'qux', (e) => {}));
      el.dispatchEvent(new Event('change'));
      expect(localStorage.getItem('baz')).toBe('qux');
    });

    it('should work for any of the following type signatures', function() {
      //setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event), covered above
      //setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
      //setLocalStorage :: (Event -> *) -> (Event -> Event), covered above
      let el   = document.createElement('div');
      el.val   = 'imaval';
      el.label = 'imakey';
      el.addEventListener('keydown', d.setLocalStorage('val', (e) => {}));
      el.dispatchEvent(new Event('keydown'));
      expect(localStorage.getItem('imakey')).toBe('imaval');
    });

    it('should use the result of the event handler if val is null', function() {
      let el   = document.createElement('div');
      el.label   = 'yo';
      el.value   = 'mamasofat';
      el.addEventListener('click', d.setLocalStorage(null, (e) => { return 12; }));
      el.dispatchEvent(new Event('click'));
      expect(localStorage.getItem('yo')).toBe('12');
    });
  });
} else {
  console.log('skipping localStorage test');
}

if (WORKER) {
  describe('parallelize', function() {
    it('should run a function in a separate thread', function(done) {
      let errHandle = (e) => {
        expect('I failed').toBe(true);
        done();
      };
      let parSum = d.timeoutP(500, d.parallelize(function(arg) {
        return arg.reduce((a, b) => a + b, 0);
      }));
      let result = parSum(1, 2, 3);
      result.then((v) => {
        expect(v).toBe(6);
        done();
      }).catch(errHandle);
    });

    it('should reject appropriately on error', function(done) {
      let throws = d.parallelize(function(arg) {
        return arg[0].foo();
      });
      let error = throws(6);
      error.then(() => {
        throw new Error('shouldnt see this');
      }).catch((e) => {
        expect(e instanceof Error).toBe(true); //unnecessary really
        done();
      });
    });
  });
} else {
  console.log('skipping Worker test');
}
