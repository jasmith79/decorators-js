/*
 *Common decorators and combinators I use in Javascript
 *@author Jared Smith
 *@copyright Jared Adam Smith, 2015, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

// Extracts internal [[class]] property of a javascript value
// _extractHiddenClass :: * -> String
const _extractHiddenClass = (r => a => {
  return Object.prototype.toString.call(a).match(r)[1];
})(/ ([a-z]+)]$/i);

const _applyConstructor = (ctor, args) => {
  return new (ctor.bind.apply(ctor, [ctor, ...args]));
};

// NOTE: the 'this' context will be determined at the time the curried function receives its
// **final** argument.
const curry = function(len, f, ...initArgs) {
  let [fn, arity, fnArgs] = (() => {
    switch (true) {
      case _extractHiddenClass(len) === 'Function':
        let args = f == null ? [] : [f, ...initArgs];
        return [len, len.length, args];
      case _extractHiddenClass(len) === 'Number':
        return [f, len, initArgs];
      default:
        throw new TypeError(`Unrecognized arguments ${len} and ${f} to function curry.`);
   }
  })();

  if (!fn) {
    return function(fn, ...args) {
      return curry.apply(this, [arity, fn].concat(args));
    };
  }

  let helper = args => {
    return function(...rest) {
      return currier.call(this, arity, fn, [...args, ...rest]);
    };
  };

  let currier = function(length, f, args) {
    if (args.length >= length) {

      // ES 6 classes and built-ins, real or polyfilled, throw a TypeError if you try to call them
      // as a function.
      try {
        return f.apply(this, args);
      } catch (e) {
        if (e instanceof TypeError) {
          return _applyConstructor(f, args);
        } else {
          throw e;
        }
      }
    } else {
      return helper(args);
    }
  };

  return currier.call(this, arity, fn, fnArgs);
};

const apply = curry(function(f, args) {
  return f.apply(this, args);
});

//debounce :: Number -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel
const debounce = (n, immed, f) => {
  let [fn, now] = (() => {
    switch(_extractHiddenClass(immed)) {
      case 'Boolean':
        return [f, immed];
      case 'Function':
        return [immed, false];
      default:
        throw new TypeError(`Unrecognized arguments ${immed} and ${f} to function debounce.`);
    }
  })();

  let timer = null;
  return function (...args) {
    if (timer === null && now) {
      fn.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), n);
    return timer;
  }
};

//throttle :: Number -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel
const throttle = curry((delay, fn) => {
  let timer = null, last = null;
  return function(...args) {
    let now = Date.now();
    if (last != null && (now < last + delay)) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = now;
        fn.apply(this, args)
      }, delay);
    } else {
      last = now;
      fn.apply(this, args);
    }
    return timer;
  };
});

// pipe
// Forward function composition.
const pipe = (...fs) => {
  return function(...args) {
    let first = fs.shift();
    return fs.reduce((acc, f) => {
      return f.call(this, acc);
    }, first.apply(this, args));
  };
};

//denodeify :: (* -> *) -> (* -> Promise *)
//Turns a callback-accepting function into one that returns a Promise.
const denodeify = fn => {
  let length = fn.length > 0 ? fn.length - 1 : 0;
  let f = function(...args) {
    return new Promise((resolve, reject) => {
      fn.apply(this, [...args, (err, ...rest) => {
        if (err) {
          reject(err);
        }
        let result;
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
      }]);
    });
  };

  return length ? curry(length, f) : f;
};

//trampoline :: (* -> *) -> (* -> *)
const trampoline = fn => {
  return curry(fn.length, function(...args) {
    let result = fn.apply(this, args);
    while (_extractHiddenClass(result) === 'Function') {
      result = result();
    }
    return result;
  });
};

const bindArity = curry((n, f) => {
  return function(...args) {
    return f.apply(this, args.slice(0, n));
  };
});

const unary = bindArity(1);

const _memoized = {};
const memoize = f => {
  return function(...arr) {
    let args = arr.map(arg => {
      let s = arg.toString();
      if (s === '[object Object]') {
        throw new TypeError('Unhashable argument to function memoize.');
      }
      return s;
    });

    let str = args.join('');
    let m = _memoized[str];
    if (m) {
      return m;
    } else {
      let res = f.apply(this, arr);
      _memoized[str] = res;
      return res;
    }
  };
};

const maybe = (f, strict=true) => {
  let method = strict ? 'some' : 'every';
  return function(...args) {
    if (f.length && args[method](a => a == null)) return null;
    return f.apply(this, args);
  }
};

const applyConstructor = curry(_applyConstructor);

const bindPromise = f => {
  return function(p) {
    return p.then(arg => {
      return f.call(this, arg);
    });
  };
};

export {
  trampoline,
  pipe,
  curry,
  bindArity,
  unary,
  debounce,
  throttle,
  applyConstructor,
  apply,
  denodeify,
  memoize,
  maybe,
  bindPromise
};