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
//curry Number -> ([a] -> a) -> ([a] -> a)
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

//_getType :: * -> String
const _getType = (t) => {
  switch (true) {
    case ('string' === typeof t):
      return t;
    case ('symbol' === typeof t):
    case ('undefined' === typeof t):
    case ('boolean' === typeof t):
    case ('number' === typeof t):
      return typeof t;
    case ('function' === typeof t):
      return _getFnName(t); //assume constructor
    case ('object' === typeof t):
      return null === t ? 'null' : (t.constructor.name || _class(t));
  }
};

//typeGuard :: [String] -> (* -> *) -> (* -> *)
const typeGuard = ((check) => {
  return curry((ts, fn) => {
    let arr = _isArray(ts) && ts.length ? ts : [ts];
    let types = arr.map((t) => 'string' === typeof t ? t.toLowerCase() : t);
    //keep all the args, but typecheck the first only, assume curried
    return curry(fn.length, function(...args) {
      let test = check(args[0]);
      let passed = types.some(test);
      if (!passed) {
        let type = _getType(args[0]), expected = types.map(_getType).join(',');
        throw new TypeError(`In fn ${_getFnName(fn)} expected one of ${expected}, got ${type}.`);
      }
      return fn.apply(this, args);
    });
  });
})(curry((arg, type) => {
  let passed = false, argType = typeof arg, t = typeof type, clazz = _class(arg);
  switch (true) {
    case (type === arg):
    case (type === argType && 'object' !== argType):
    case ('function' === t && arg instanceof type):
    case ('object' === t && arg instanceof type.constructor):
    case ('object' === t && clazz !== 'Object' && _class(type) === clazz): //null et al
    case (_class(arg).toLowerCase() === type):
      passed = true;
      break;
  }
  return passed;
}));

//_fnFirst :: (* -> *) -> (* -> *)
const _fnFirst = typeGuard('function');

//unGather :: (* -> *) -> (* -> *)
//Conditionally unnests the arguments to a function, useful for functions that use rest params to
//gather args.
const unGather = _fnFirst(function(...args) {
  let [fn, ...initArgs] = args;
  let f = curry(fn.length, function(...fnArgs) {
    let arr = fnArgs[0], params = fnArgs.length === 1 && _isArray(arr) ? arr : fnArgs;
    return fn.apply(this, params);
  });
  return initArgs.length ? f.apply(this, initArgs) : f;
});

//maybe :: (* -> *) -> (* -> *)
//maybe :: (* -> *) -> (Null -> Null)
const maybe = _fnFirst((fn) => {
  return curry(fn.length, function(...args) {
    return args.every(x => x != null) ? fn.apply(this, args) : null;
  });
});

//_trim :: String -> String
const _trim = maybe(typeGuard('string', (str) => str.trim()));

//debounce :: Number -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel
const debounce = curry((delay, fn) => {
  if ('function' !== typeof fn) {
    throw new TypeError("Cannot debounce a non-function");
  }
  let timer = null;
  return curry(fn.length, function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
    return timer;
  });
});

//throttle :: Number -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel
const throttle = curry((delay, fn) => {
  if ('function' !== typeof fn) {
    throw new TypeError("Cannot throttle a non-function");
  }
  let timer = null, last = null;
  return curry(fn.length, function(...args) {
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
  return curry(fn.length, function(...args) {
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
  });
});

//setLocalStorage :: (Event -> [String]), String, String -> (Event -> Event)
//meant to decorate an event handler with adding the current value (or whatever desired property)
//of the event target to local storage. The check on the return value of the function allows the
//decorated function to supply alternative values for setting to localStorage.
const setLocalStorage = _fnFirst((fn, prop = 'label', val = 'value') => {
  return curry(1, function(e) {
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
  return curry(length, function(...args) {
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

//unNew :: (* -> a) -> (* -> a)
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
  return curry(f.length, function(...args) {
    console.time(name);
    let result = fn.apply(this, args);
    console.timeEnd(name);
    return result;
  });
});

//trampoline :: (* -> *) -> (* -> *)
const trampoline = _fnFirst((fn) => {
  return curry(fn.length, function(...args) {
    let result = fn.apply(this, args);
    while (result instanceof Function) {
      result = result();
    }
    return result;
  });
});

//lift :: (* -> a) -> (* -> *) -> (* -> a)
//takes a type constructor for type a and wraps the return value of the passed-in function in type
//a. Type constructors should be guarded, for an example see liftP and liftA below. Note that if the
//function returns an *array* then array will be applied to the constructor, i.e. constructors
//requiring `new` should be wrapped in unNew.
const lift = curry((constructor, fn) => {
  return curry(fn.length, function(...args) {
    let result = fn.apply(this, args);
    switch (false) {
      case (!_isArray(result)):             return constructor(...result);
      case ('undefined' !== typeof result): return constructor();
      default:                              return constructor(result);
    }
  });
});

//liftP :: (* -> *) -> (* -> Promise *)
//I do this often enough for Promises that I baked it in.
const liftP = lift((...args) => Promise.resolve(args.length > 1 ? args : args[0]));

//liftA :: (* -> *) -> (* -> [*])
//ditto arrays
const liftA = lift(unGather((...args) => args));

//bindP :: (* -> Promise *) -> (Promise * -> Promise *)
const bindP = _fnFirst((fn) => {
  return curry(1, function(promise) {
    return promise.then((a) => fn.call(this, a));
  });
});

//loopP :: (* -> *) -> (Null -> Promise *)
//Starts a loop that continually calls the promise-returning function each time the previous
//iteration resolves with the value of that resolution. Useful for long-polling. Returns a function
//that when called breaks the loop and returns a Promise of last value.
const loopP = ((err) => {
  return _fnFirst(function(fn, ...args) {
    let done = false, promise = fn(...args);
    if ('function' !== typeof promise.then) {
      throw err;
    }
    let update = (val) => promise = fn(val).then((v) => {
      if (!done) {
        enqueue();
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
const timeoutP = typeGuard('number', curry(2, function(timeout, fn) {
  return curry(fn.length, function(...args) {
    let promise = fn.apply(this, args);
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
}));

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
  lift,
  liftP,
  liftA,
  bindP,
  loopP,
  timeoutP,
};
