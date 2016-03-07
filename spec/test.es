/*
 * Tests for decorators.js.
 * @author Jared Smith, jasmith79@gmail.com;
 * @copyright Jared Smith, 2015
 * Licensed under the MIT license. You should have received a copy with this software, otherwise see
 * https://opensource.org/licenses/MIT.
 *
 */

import * as d from './decorators.min.js';

//needed for multiple tests
let sum      = function(a,b,c) { return a + b + c; };
let noop     = function(){};
let identity = x => x;
let makeDate = d.unNew(Date);
let fortytwo = () => 42;
class Foo {};
class Bar extends Foo {};

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
    let symbol  = d.typeGuard('symbol',    identity);
    let undef   = d.typeGuard('undefined', identity);
    let boolean = d.typeGuard('boolean',   identity);
    let o       = {};
    let sym     = Symbol('sym');
    expect(string('a')).toBe('a');
    expect((() => string(3))).toThrowError(TypeError);
    expect(number(3)).toBe(3);
    expect((() => number('a'))).toThrowError(TypeError);
    expect(func(identity)).toBe(identity);
    expect((() => func(3))).toThrowError(TypeError);
    expect(object(o)).toBe(o);
    expect((() => object(3))).toThrowError(TypeError);
    expect(symbol(sym)).toBe(sym);
    expect((() => symbol('sym'))).toThrowError(TypeError);
    expect(undef(undefined)).toBe(undefined);
    expect((() => undef(null))).toThrowError(TypeError);
    expect(boolean(true)).toBe(true);
    expect((() => boolean(null))).toThrowError(TypeError);
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
    let fnDate    = d.typeGuard(Date,     identity);
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
    setTimeout(f, 100);    //should be delayed
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

// describe('debounce', function() {
//   it('should drop calls repeated in the waiting period', function(done) {
//     let halfsec = d.debounce(500), counter = 0, f = halfsec(() => counter += 1);
//     let o = {
//       num: 0,
//       fn: d.debounce(500, function(){ this.num += 1; })
//     };
//     f();
//     f();
//     f();
//     o.fn();
//     o.fn();
//     o.fn();
//     setTimeout(() => {
//       expect(counter).toBe(1);
//       expect(o.num).toBe(1);
//       done();
//     });
//   });
// });

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
    // var factorial = function(n) {
    //   var _factorial = d.trampoline(function myself(acc, n) {
    //     return n > 0
    //     ? function () { return myself(acc * n, n - 1); }
    //     : acc;
    //   });
    //
    //   return _factorial(1, n);
    // };
    function factorial (n) {
      var _factorial = d.trampoline( function myself (acc, n) {
        return n
        ? function () { return myself(acc * n, n - 1); }
        : acc
      });

      return _factorial(1, n);
    }
    expect(factorial(32000)).toBe(Infinity);
  });
});

describe('unNew', function() {
  let args = [2015, 0, 1, 12, 0, 0, 0];
  let jan1 = makeDate(...args);

  it('should allow a constructor function to be curried/applied/called', function() {
    expect(jan1.getFullYear()).toBe(2015);
    expect(jan1.getMonth()).toBe(0);
    expect(jan1.getDate()).toBe(1);
    expect(jan1.getHours()).toBe(12);
    expect(jan1.getMinutes()).toBe(0);
    expect(jan1.getSeconds()).toBe(0);
  });

  it('should not break instanceof', function() {
    let makeBar = d.unNew(Bar);
    let bar = makeBar();
    expect(jan1 instanceof Date).toBe(true);
    expect(bar instanceof Foo).toBe(true);
  });
});

describe('liftP', function() {
  it('should turn a function into a promise-returning fn', function(done) {
    let p = d.liftP(fortytwo)();
    p.then((v) => {
      expect(v).toBe(42);
      done();
    });
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
      });
      done();
    }, 500);
  });
});
