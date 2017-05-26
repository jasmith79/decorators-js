import * as d from './decorators.js';
let add = (a, b) => a + b;
class Foo {
  constructor (a, b) {
    this.val = a + b;
  }
};

let Bar = class {
  constructor (a) {
    this.a = a;
  }
};

describe('applyConstructor', () => {
  it('should allow the use of Function.prototype.apply with a class constructor.', () => {
    expect(d.applyConstructor(Foo, [1, 2]).val).toBe(3);
  });
});

describe('curry', () => {
  let curriedAdd = d.curry(add);
  it('should allow parameters to be applied individually.', () => {
    expect(curriedAdd(2)(3)).toBe(5);
  });

  it('should allow all the parameters to be supplied at once.', () => {
    expect(d.curry(add, 2, 3)).toBe(5);
  });

  it('should allow all the parameters to be supplied in chunks.', () => {
    expect(curriedAdd(2, 3)).toBe(5);
  });

  it('should work for constructors.', () => {
    let curriedFoo = d.curry(Foo);
    expect((curriedFoo(1)(2)).val).toBe(3);
  });

  it('should itself be able to be partially applied.', () => {
    let curry2 = d.curry(2);
    let plus = curry2(add);
    expect(plus(2)(3)).toBe(5);
  });

  it('should use the context at the time the curried function is called.', () => {
    Bar.prototype.add2 = d.curry(function(b, c) {
      return this.a + b + c;
    })(2);
    expect(new Bar(1).add2(3)).toBe(6);
  });

  it('should throw on unknown args.', () => {
    expect(() => d.curry(true, 'foobar')).toThrow();
  });

  it('should work for applyConstructor', () => {
    let appDate = d.applyConstructor(Date);
    expect(appDate([2014, 1, 1]).getTime()).toBe(new Date(2014, 1, 1).getTime());
  });
});

describe('apply', () => {
  it('should allow a function with positional arguments to be supplied an array.', () => {
    expect(d.apply(add, [1,2])).toBe(3);
  });

  it('should use the context at the time the function is called.', () => {
    let obj = {
      a: 1,
      add: d.apply(function(b, c) { return this.a + b + c; })
    };

    expect(obj.add([2, 3])).toBe(6);
  });
});

describe('pipe', () => {
  it('should allow forward function composition.', () => {
    let add2 = d.curry(add, 2);
    let multiply3 = n => n * 3;
    let addThenMult = d.pipe(add2, multiply3);
    expect(addThenMult(0)).toBe(6);
  });

  it('should use the context of the piped call throughout.', () => {
    let obj = {
      a: null,
      fn: d.pipe(
        function(n) { this.a = n + 2 },
        function() { this.a *= 3 }
      )
    };
    obj.fn(0);
    expect(obj.a).toBe(6);
  });
});

describe('debounce', () => {
  it('should drop calls repeated in the waiting period', done => {
    let wait = d.curry(2, d.debounce)(10), counter = 0, f = wait(() => counter += 1);
    let o = {
      num: 0,
      fn: d.debounce(10, function(){ this.num += 1; })
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
      done();
    }, 12);
  });

  it('should have a leading-edge version', done => {
    let wait = d.curry(3, d.debounce)(10, true), counter = 0, f = wait(() => counter += 1);
    let o = {
      num: 0,
      fn: d.debounce(10, true, function(){ this.num += 1; })
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
      }, 4);
    }, 8);
  });
});

describe('throttle', () => {
  it('should not fire again until after the waiting period', function(done) {
    let wait = d.throttle(10), counter = 0, f = wait(() => counter += 1);
    let o = {
      num: 0,
      fn: d.throttle(10, function(){ this.num += 1; })
    };
    f();
    o.fn();
    setTimeout(f, 5);            //should be delayed
    setTimeout(() => o.fn(), 5); //should be delayed
    setTimeout(() => {
       expect(counter).toBe(1);
       expect(o.num).toBe(1);
    }, 8);
    setTimeout(() => {
      expect(counter).toBe(2);
      expect(o.num).toBe(2);
      done();
    }, 20);
  });
});

describe('bindArity', () => {
  let boo = (a, b, c) => [a, b, c].toString();

  it('should return a function that only receives n arguments', () => {
    expect(d.bindArity(2, boo)(1, 2, 3)).toBe('1,2,');
  });

  it('should use the context.', () => {
    let obj = {
      a: 1,
      yo: d.bindArity(1, function(b, c) { return [this.a, b, c].toString(); })
    };

    expect(obj.yo(2,3)).toBe('1,2,');
  });
});

describe('trampoline', () => {
  let factorial = function factorial (n) {
    var _factorial = d.trampoline( function myself (acc, n) {
      return n
      ? function () { return myself(acc * n, n - 1); }
      : acc
    });

    return _factorial(1, n);
  };

  it('should use bounded stack space to run thunk-returning tail-recursive fns', function() {
    expect(factorial(32000)).toBe(Infinity);
  });

  // TODO: test this
  // it('should use the context.', () => {
  //
  // });
});

describe('denodeify', function() {
  it('should turn a callback-accepting function into a promise returning one', function(done) {
    let passes = d.denodeify((a, b, cb) => cb(null, a + b))(4,5);
    let fails  = d.denodeify((cb) => cb(new Error()))();
    let multi  = d.denodeify((a, b, cb) => cb(null, a, b))(1,2);

    passes
      .then((v) => {
        expect(v).toBe(9);
        //return fails;
        done();
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

  it('should preserve ctx for methods', done => {
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

describe('memoize', () => {
  it('should avoid recomputing.', done => {
    let f = d.memoize(function(a, b) {
      return new Promise(res => {
        setTimeout(_ => { res(a + b) }, 10);
      });
    });

    f(2, 3).catch(err => console.log(err));
    setTimeout(_ => {
      let timeout = setTimeout(_ => {
        expect(false).toBe(true);
        done();
      }, 5);
      let p = f(2, 3);
      p.then(val => {
        expect(val).toBe(5);
        done();
      }).catch(err => console.log(err));
    }, 12);
  });
});

describe('maybe', () => {
  it('should return null if any the arguments are null or undefined', () => {
    let f = d.maybe(add);
    expect(f(null, 3)).toBe(null);
  });

  it('should have a loose mode where it returns null only if *all* arguments are null/undefined', () => {
    let canHaveNull = d.maybe((a, b) => { return b; }, false);
    expect(canHaveNull(null, 3)).toBe(3);
  });

  it('should work for arity 0 functions irregardless', () => {
    let yields3 = d.maybe(() => 3);
    expect(yields3()).toBe(3);
  });

  it('should preserve ctx for methods', () => {
    let obj = {
      a: 1,
      fn: d.maybe(function(b) { return this.a + b; })
    };

    expect(obj.fn(null)).toBe(null);
    expect(obj.fn(5)).toBe(6);
  });
});

describe('bindPromise', () => {
  it('should turn a normal function into a Promise-accepting one.', done => {
    let add3 = d.curry(add, 3);
    d.bindPromise(add3)(Promise.resolve(2)).then(val => {
      expect(val).toBe(5);
      done();
    });
  });

  it('should preserve ctx for methods', done => {
    let obj = {
      a: 1,
      fn: d.bindPromise(function(b) { return this.a + b; })
    };

    obj.fn(Promise.resolve(2)).then(val => {
      expect(val).toBe(3);
      done();
    });
  });
});