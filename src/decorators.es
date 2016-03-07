/*
 *Common decorators I use in javascript
 *@author Jared Smith
 *@copyright Jared Adam Smith, 2015
 *Licensed under the MIT license. You should have received a copy with this software, otherwise see
 *https://opensource.org/licenses/MIT.
 *
 */

const _global = (() => {
  let window = window || null;
  let global = global || null;
  return window || global;
});

/*   Functions   */

//curry ([a] -> a) -> ([a] -> a)
//curry Integer -> ([a] -> a) -> ([a] -> a)
//inspired by Nick Fitzgerald's implementation for wu.js
const curry = ((c) => {
  let _curry = function(n, f) {
    let length, fn, ctx = this === _global ? null : this;
    switch (true) {
      case (f != null):
        fn = f, length = n;
        break;
      case ('function' === typeof n):
        fn = n, length = n.length;
        break;
      case ('number' === typeof n):
        return function(func) { return _curry.call(null, n, func); };
      default:
        throw new Error(`Type ${typeof n} unable to be curried.`);
        break;
    }
    return function(...fnArgs) {
      let ctx = this === _global ? null : this;
      if (fnArgs.length < length) {
        let currLength = length - fnArgs.length;
        let curried = c.apply(ctx, [fn, ...fnArgs]);
        return currLength > 0 ? _curry.call(null, currLength, curried) : curried;
      } else {
        return fn.apply(ctx, fnArgs);
      }
    };
  };
  return _curry;
})(function(fn, ...args) {
  let ctx = this === _global ? null : this;
  return (...fnArgs) => fn.apply(ctx, [...args, ...fnArgs])
});

//IE workaround for lack of function name property on Functions
//_getFnName :: (* -> *) -> String
const _getFnName = (r => fn => {
  return fn.name || ((('' + fn).match(r) || [])[1] || 'Anonymous');
})(/^\s*function\s*(\S*)\s*\(/);

//Extracts internal [[class]] property of a javascript value
//_class :: * -> String
const _class = ((r) => a => Object.prototype.toString.call(a).match(r)[1])(/\s([a-zA-Z]+)/);

//_isArray :: * -> Boolean
//IE workaround for lack of Array.isArray
const _isArray = a => _class(a) === 'Array' || (a instanceof Array);

//typeGuard :: String -> (* -> *) -> (* -> *)
//typeGuard :: (* -> Object) -> (* -> *) -> (* -> *)
const typeGuard = curry((t, fn) => {
  return function(...args) {
    let arg = args[0], ctx = this === _global ? null : this, passed = false;
    let first   = 'string' === typeof arg ? arg.toLowerCase() : arg;
    let type    = 'string' === typeof t   ? t.toLowerCase()   : t;
    let argType = typeof first;
    switch (true) {
      case (type === first):
      case (type === argType && 'object' !== argType):
      case ('function' === typeof type && first instanceof type):
      case ('object' === argType && ('object' === type || Object === type)):
      case ('object' === argType && first === null && type === 'null'):
      case (_class(first).toLowerCase() === type):
        passed = true;
        break;
    }
    if (!passed) {
      throw new TypeError(`In fn ${_getFnName(fn)} expected ${type}, got ${first}.`);
    }
    return fn.apply(ctx, args);
  }
});

//_fnFirst :: (* -> *) -> (* -> *)
const _fnFirst = typeGuard('function');

//_noGlobalCtx :: (* -> a) -> (* -> a)
//Ensures passed-in function is not executed with global context set to `this`. Returned function
//is automatically curried.
const _noGlobalCtx = _fnFirst((fn) => {
  return curry(fn.length, function(...args) {
    let ctx = this === _global ? null : this;
    return fn.apply(ctx, args);
  });
});

//unGather :: (* -> *) -> (* -> *)
//Conditionally unnests the arguments to a function, useful for functions that use rest params to
//gather args.
const unGather = _fnFirst(function(...args) {
  let [fn, ...initArgs] = args;
  let f = _noGlobalCtx(function(...fnArgs) {
    let arr = fnArgs[0], params = fnArgs.length === 1 && _isArray(arr) ? arr : fnArgs;
    return fn.apply(this, params);
  });
  return initArgs.length ? f.apply(this, initArgs) : f;
});

//maybe :: (* -> *) -> (* -> *)
//maybe :: (* -> *) -> (Null -> Null)
const maybe = _fnFirst((fn) => {
  return _noGlobalCtx(curry(fn.length, function(...args) {
    return args.every(x => x != null) ? fn.apply(this, args) : null;
  }));
});

//_trim :: String -> String
const _trim = maybe(typeGuard('string', (str) => str.trim()));

//debounce :: Integer -> (* -> Null) -> Integer
//Delay in milliseconds. Returns the timer ID so caller can cancel
const debounce = curry((delay, fn) => {
  if ('function' !== typeof fn) {
    throw new TypeError("Cannot debounce a non-function");
  }
  let timer = null;
  return _noGlobalCtx(function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
    return timer;
  });
});

//throttle :: Integer -> (* -> Null) -> Integer
//Delay in milliseconds. Returns the timer ID so caller can cancel
const throttle = curry((delay, fn) => {
  if ('function' !== typeof fn) {
    throw new TypeError("Cannot debounce a non-function");
  }
  let timer = null, last = null;
  return _noGlobalCtx(function(...args) {
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
const log = _fnFirst((fn) => {
  return curry(fn.length, _noGlobalCtx(function(...args) {
    let res = fn.apply(this, args);
    let result = null, name = _getFnName(fn), fnArgs = args.length ? args : "no arguments";
    switch (typeof res) {
      case 'object':
      case 'string':
        result = res;
        break;
      default:
        result = res.toString();
        break;
    }
    console.log(`Fn ${name} called with ${fnArgs} yielding ${result}`);
    return res;
  }));
});

//setLocalStorage :: (Event -> [String]), String, String -> (Event -> Event)
//meant to decorate an event handler with adding the current value (or whatever desired property)
//of the event target to local storage. The check on the return value of the function allows the
//decorated function to supply alternative values for setting to localStorage.
const setLocalStorage = _fnFirst((fn, prop = 'label', val = 'value') => {
  return _noGlobalCtx(function(e) {
    let result = fn.call(this, e), el = e.currentTarget;

    //second half is for labels
    let key = el[prop] || el.parentNode.textContent.trim();
    let value = _trim(el[val]);
    if (key != null && value != null) {
      localStorage.setItem(key, value);
    }
    return e;
  });
});

//denodeify :: (* -> a) -> (* -> Promise a)
//Turns a callback-accepting function into one that returns a Promise.
const denodeify = _fnFirst((fn) => {
  let length = fn.length > 0 ? fn.length - 1 : 0;
  return curry(length, _noGlobalCtx(function(...args) {
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
  }));
});

//unNew :: (* -> {k:v}) -> (* -> {k:v})
//Wraps a constructor so that it may be not only called without new but used with .apply(). Note
//unlike ramda's `construct` the unNewed constructor is variadic.
const unNew = ((construct) => {
  let fn = (n, f) => {
    let length, ctor;
    switch (true) {
      case (f != null):
        ctor = f, length = n;
        break;
      case ('function' === typeof n):
        ctor = n, length = n.length;
        break;
      default:
        throw new Error(`Type ${typeof n} unable to be called as a constructor.`);
        break;
    }
    return curry(length, (...args) => {
      return construct(ctor, ...args);
    });
  };
  return fn;
})((...args) => {
  let [ctor] = args;
  return new (ctor.bind.apply(ctor, args))();
});

//runtime :: (* -> *) -> (* -> *)
const runtime = _fnFirst(f => {
  let fn = log(f), name = _getFnName(f);
  return _noGlobalCtx(curry(f.length, function(...args) {
    console.time(name);
    let result = fn.apply(this, args);
    console.timeEnd(name);
    return result;
  }));
});

//trampoline :: (* -> *) -> (* -> *)
const trampoline = _fnFirst((fn) => {
  return _noGlobalCtx(function(...args) {
    let result = fn.apply(this, args);
    while (result instanceof Function) {
      result = result();
    }
    return result;
  });
});

//liftP :: (* -> *) -> (* -> Promise *)
const liftP = _fnFirst((fn) => {
  return _noGlobalCtx(curry(fn.length, function(...args) {
    return Promise.resolve(fn.apply(this, args));
  }));
});

//bindP :: (* -> Promise *) -> (Promise * -> Promise *)
const bindP = _fnFirst((fn) => {
  return _noGlobalCtx(function(promise) {
    return promise.then((a) => fn.call(this, a));
  });
});

//loopP :: (Null -> *) -> (Null -> Promise *)
//Starts a loop that continually calls the promise-returning function each time the previous
//iteration resolves. These calls should primarily be concerned with side-effects like updating
//the DOM. Useful for long-polling. Returns a function that when called breaks the loop and returns
//a Promise of last value.
const loopP = ((err) => {
  return _fnFirst(_noGlobalCtx(function(fn) {
    let done = false, promise = fn();
    if ('function' !== typeof promise.then) {
      throw err;
    }
    let update = () => promise = fn().then((v) => {
      if (!done) {
        enqueue();
      }
      return v;
    });
    let enqueue = () => promise.then((v) => {
      if (!done) {
        update();
      }
      return v;
    });
    promise.then(update);
    return () => {
      done = true;
      return promise;
    };
  }));
})(new TypeError('Callback function must return a Promise'));

export {
  curry,
  typeGuard,
  maybe,
  unGather,
  debounce,
  throttle,
  log,
  setLocalStorage,
  denodeify,
  unNew,
  runtime,
  trampoline,
  liftP,
  bindP,
  loopP,
};
