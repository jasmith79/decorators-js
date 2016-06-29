/*
 *Common decorators and combinators I use in Javascript
 *@author Jared Smith
 *@copyright Jared Adam Smith, 2015, 2016
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

 //IE workaround for lack of function name property on Functions
 //_getFnName :: (* -> *) -> String
 const _getFnName = (r => fn => {
   return fn.name || ((('' + fn).match(r) || [])[1] || 'Anonymous');
 })(/^\s*function\s*(\S*)\s*\(/);

import * as typed from 'js-typed';

const _global = (() => {
  switch (true) {
    case 'undefined' !== typeof window: return window;
    case 'undefined' !== typeof global: return global;
    case 'undefined' !== typeof self:   return self;
    default:                            return (new Function('return this;'))()
  }
})();

const _takesFn = typed.guard(['function']);

// Extracts internal [[class]] property of a javascript value
// _extractHiddenClass :: * -> String
const _extractHiddenClass = (r => a => {
  return Object.prototype.toString.call(a).match(r)[1].toLowerCase();
})(/ ([a-z]+)]$/i);

//unGather :: (* -> *) -> (* -> *)
//Conditionally unnests the arguments to a function, useful for functions that use rest params to
//gather args.
const unGather = _takesFn(fn => {
  return typed.curry(fn.length, function(...args) {
    let arr = args[0], params = args.length === 1 && typed.isType('array', arr) ? arr : args;
    return fn.apply(this, params);
  });
});

//maybe :: (* -> *) -> (* -> *)
//maybe :: (* -> *) -> (Null -> Null)
const maybe = _takesFn(fn => {
  return typed.curry(fn.length, function(...args) {
    return args.every(x => x != null) ? fn.apply(this, args) : null;
  });
});

//_trim :: String -> String
const _trim = typed.Dispatcher([
  [['null'], x => null],
  [['string'], s => s.trim()]
]);

//debounce :: Number -> (* -> Null) -> Number
//debounce :: Number -> Boolean -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
//is whether the function fires on the leading edge or trailing edge (defaults to false).
const debounce = (f => {
  return typed.Dispatcher([
    [['number','boolean','function'], (n, now, fn) => f(n, now, fn)],
    [['number','function'], (n, fn) => f(n, false, fn)]
  ]);
})((n, now, fn) => {
  let timer = null;
  return typed.curry(fn.length, function(...args) {
    if (timer === null && now) {
      fn.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), n);
    return timer;
  });
});

//throttle :: Number -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel
const throttle = typed.guard(['number','function'], (delay, fn) => {
  let timer = null, last = null;
  return typed.curry(fn.length, function(...args) {
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
  });
});

//log :: (* -> *) -> [*] -> *
const log = _takesFn(fn => {
  return typed.curry(fn.length, function(...args) {
    let res = fn.apply(this, args);
    let result = null, name = _getFnName(fn), fnArgs = args.length ? args : "no arguments";
    switch (typeof res) {
      case 'object':
      case 'undefined':
      case 'string':
        result = res;
        break;
      default:
        result = res.toString();
        break;
    }
    console.log(`Fn ${name} called with ${fnArgs} yielding ${result}`);
    return res;
  });
});

// padInt :: (* -> Number) -> (* -> String)
// padInt :: Number -> (* -> Number) -> (* -> String)
// padInt :: Number -> Number -> String
// Pads the numeric results of the passed-in function with leading zeros up to the given length
// Can also work as a standalone function if passed two numbers.
const _padInt = (a, b) => '0'.repeat(a) + b;
const _padResult = (n, fn) => function(...args) {
  let result = fn.apply(this, args).toString();
  return result.length < n ? _padInt(n - result.length, result) : result;
};
const padInt = typed.Dispatcher([
  [['number','function'], _padResult],
  [['number','number'], (l, n) => _padResult(l, x => x)(n)],
  [['function'], fn => _padResult(2, fn)]
]);

//setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)
//setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
//setLocalStorage :: (Event -> *) -> (Event -> Event)
//meant to decorate an event handler with adding the current value (or whatever desired property)
//of the event target to local storage. Passing in null for the second param allows the
//decorated function to supply alternative values for setting to localStorage.
const setLocalStorage = (f => {
  return typed.Dispatcher([
    [['string','string','function'], (prop, val, fn) => f(prop, val, fn)],
    [['string','null','function'], (prop, val, fn) => f(prop, null, fn)],
    [['string','function'], (val, fn) => f('label', val, fn)],
    [['null','function'], (val, fn) => f('label', val, fn)],
    [['function'], fn => f('label', 'value', fn)]
  ]);
})((prop, val, fn) => {
  return function(e) {
    let result = fn.call(null, e), el = e.currentTarget || this; // e.g. google maps
    let key = el[prop] || _trim(el.parentNode.textContent);
    let value = val === null ? result : _trim(el[val]);
    if (key != null && value != null) {
      localStorage.setItem(key, value);
    }
    return e;
  }
});
// const setLocalStorage = (...args) => {
//   let f = typeGuard(['function', 'string'], (prop, v, func) => {
//     return curry(1, function(e) {
//       let arity2 = 'function' === typeof v;
//       let val    = arity2 ? 'value' : v;
//       let fn     = arity2 ? v : func;
//       let result = fn.call(null, e), el = e.currentTarget || this; //google maps
//
//       //second half is for labels
//       let key = el[prop] || el.parentNode.textContent.trim();
//       let value = val === null ? result : _trim(el[val]);
//       if (key != null && value != null) {
//         localStorage.setItem(key, value);
//       }
//       return e;
//     });
//   });
//
//   switch (false) {
//     case (!(args.length === 1)):
//       if ('function' === typeof args[0]) {
//         return f('label', 'value', args[0]);
//       } else {
//         return f(args[0]);
//       }
//     case (!(args.length === 2 && 'function' === typeof args[1])):
//       let [value, fn] = args;
//       return f('label', value, fn);
//     default:
//       return f(...args);
//   }
// };

//denodeify :: (* -> *) -> (* -> Promise *)
//Turns a callback-accepting function into one that returns a Promise.
const denodeify = _takesFn(fn => {
  let length = fn.length > 0 ? fn.length - 1 : 0;
  return typed.curry(length, function(...args) {
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
  });
});

//runtime :: (* -> *) -> (* -> *)
const runtime = _takesFn(f => {
  let fn = log(f), name = _getFnName(f);
  return typed.curry(f.length, function(...args) {
    console.time(name);
    let result = fn.apply(this, args);
    console.timeEnd(name);
    return result;
  });
});

//trampoline :: (* -> *) -> (* -> *)
const trampoline = _takesFn(fn => {
  return typed.curry(fn.length, function(...args) {
    let result = fn.apply(this, args);
    while (typed.isType('function', result)) {
      result = result();
    }
    return result;
  });
});

// //lift :: (a -> m a) -> (a -> b) -> (m a -> m b)
// //takes a type constructor for type a and wraps the return value of the passed-in function in type
// //a. Type constructors should be guarded, for an example see liftP and liftA below. Note that if the
// //function returns an *array* then array will be applied to the constructor, i.e. constructors
// //requiring `new` should be wrapped in typed.guardClass.
// const lift = typed.guard(['function','function'], (constructor, fn) => {
//   return typed.curry(fn.length, function(...args) {
//     let result = fn.apply(this, args);
//     switch(_extractHiddenClass(result)) {
//       case 'array': return constructor(...result);
//       case 'undefined': return constructor();
//       default: return constructor(result);
//     }
//   });
// });
//
// //liftA :: (* -> *) -> (* -> [*])
// const liftA = lift(unGather((...args) => args));

//bindP :: (* -> Promise *) -> (Promise * -> Promise *)
const bindP = _takesFn(fn => {
  return typed.guard('promise', function(p) {
    return p.then(a => fn.call(this, a));
  });
});

//bindA :: (* -> [*]) -> ([*] -> [*])
//Note about context, if you pass initial arguments besides the function to be decorated the
//context will be bound at that time.
const bindA = _takesFn(fn => {
  return function(args) {
    let result = fn.apply(this, args);
    return typed.isType('array', result) ? result : [result];
  }
});

//loopP :: (* -> *) -> (Null -> Promise *)
//Starts a loop that continually calls the promise-returning function each time the previous
//iteration resolves with the value of that resolution. Useful for long-polling. Returns a function
//that when called breaks the loop and returns a Promise of last value.
const loopP = ((err) => {
  //return _fnFirst(function(fn, ...args) {
  return _takesFn(function(fn, ...args) {
    let done = false, result = fn(...args), promise = Promise.resolve(result);
    let update = (val) => promise = fn(val).then((v) => {
      if (!done) {
        setTimeout(enqueue, 0);
      }
      return v;
    });
    let enqueue = () => promise.then((v) => {
      if (!done) {
        update(v);
      }
      return v;
    });
    promise.then(update);
    return () => {
      done = true;
      return promise;
    };
  });
})(new TypeError('Callback function must return a Promise'));

//timeoutP :: Number -> (* -> Promise *) -> (* -> Promise *)
//Rejects if the promise takes longer than the given delay to resolve.
//Timeout in milliseconds.
const timeoutP = typed.guard(['number','function'], (timeout, fn) => {
  return typed.curry(fn.length, function(...args) {
    let promise = Promise.resolve(fn.apply(this, args));
    let resolved = false;
    promise.then(() => resolved = true);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (resolved) {
          resolve(promise);
        } else {
          reject(new Error(`Promise from function ${_getFnName(fn)}
            failed to resolve in ${timeout/1000} seconds.`));
        }
      }, timeout);
    });
  });
});

const parallelize = ((template, f) => {
  return typed.Dispatcher([
    [['function'], fn => f(new Blob([template(fn)], { type: 'application/javascript'}))],
    [['string'], str => f(new Blob([template(str)], { type: 'application/javascript'}))],
    [['blob'], b => f(b)],
    [['array'], arr => f(new Blob(arr))]
  ]);
})(
  str => `onmessage = function(e) { postMessage((${str})(e.data)) }`,
  blob => {
    let url = URL.createObjectURL(blob);
    let worker = new Worker(url);
    URL.revokeObjectURL(url);
    return unGather((...args) => {
      return new Promise((resolve, reject) => {
        let errHandle = (e) => {
          reject(new Error(`${e.message} - ${e.filename}: ${e.lineno}`));
        }
        let listener = (e) => {
          worker.removeEventListener('message', listener);
          worker.removeEventListener('error', errHandle);
          resolve(e.data);
        };
        worker.addEventListener('message', listener);
        worker.addEventListener('error', errHandle);
        worker.postMessage(args.length > 1 ? args : args[0]);
      });
    });
  }
);

// nary :: Number -> (a -> b) -> a -> b
const nary = typed.guard(['number', 'function'], (n, f) => (...args) => f(...args.slice(0, n)));

const unary = nary(1);

export {
  maybe,
  unGather,
  debounce,
  throttle,
  log,
  setLocalStorage,
  denodeify,
  runtime,
  trampoline,
  bindP,
  bindA,
  loopP,
  timeoutP,
  parallelize,
  padInt,
  nary,
  unary,
};
