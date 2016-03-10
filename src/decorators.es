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
  let self   = self   || null;
  return window || global || self;
});

/*   Functions   */

//curry ([*] -> *) -> ([*] -> *)
//curry Number -> ([*] -> *) -> ([*] -> *)
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
        return function(func) { return _curry.call(ctx, n, func); };
      default:
        throw new Error(`Type ${typeof n} unable to be curried.`);
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

//_isNan :: has IE workaround for lack of Number.isNaN
const _isNaN = (n) => n !== n;

//typeGuard :: [String] -> (a -> *) -> (a -> *)
const typeGuard = ((check, getType) => {
  return curry((ts, fn) => {
    let arr = _isArray(ts) && ts.length ? ts : [ts];
    let types = arr.map((t) => 'string' === typeof t ? t.toLowerCase() : t);
    //keep all the args, but typecheck the first only, assume curried
    return curry(fn.length, function(...args) {
      let test = check(args[0]);
      let passed = types.some(test);
      if (!passed) {
        let type = getType(args[0]), expected = types.map(getType).join(',');
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
}), (t) => {
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
});

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
//debounce :: Number -> Boolean -> (* -> Null) -> Number
//Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
//is whether the function fires on the leading edge or trailing edge (defaults to false).
const debounce = ((f) => {
  return curry(2, typeGuard('number', (...args) => {
    let [delay, a, b] = args;
    return 'function' === typeof a ?
      f(delay, false, a) :
      'undefined' === typeof b ?
        typeGuard('function', f(delay, a)) :
        typeGuard('function', f(delay, a))(b);
  }))
})(curry((n, now, fn) => {
  let timer = null;
  return curry(fn.length, function(...args) {
    if (timer === null && now) {
      fn.apply(this, args);
    }
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), n);
    return timer;
  });
}));

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

//padInt :: (* -> Number) -> (* -> String)
//padInt :: Number -> (* -> Number) -> (* -> String)
//padInt :: Number -> Number -> String
//Pads the numeric results of the passed-in function with leading zeros up to the given length
//(defaults to 2). Can also work as a standalone function if passed two numbers.
const padInt = (f => {
  return typeGuard(['function', 'number'], (...args) => {
    let [a, b] = args;
    let x, y;
    if ('function' === typeof a) {
      x = 2, y = a;
    } else {
      x = a;
      if ('undefined' !== typeof b) {
        y = b;
      }
    }
    return y ? f(x, y) : f(x);
  });
})((fn => {
  return curry((z, c) => {
    return 'function' !== typeof c ? fn(z, c) : curry(c.length, function(...args) {
      return fn(z, c.apply(this, args));
    });
  });
})(typeGuard('number', (z, num) => {
  let str = '' + num;
  if (_isNaN(+str)) {
    throw new TypeError('Can only pad a number or numeric string');
  }
  while (str.length < z) {
    str = '0' + str;
  }
  return str;
})));

//setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)
//setLocalStorage :: String -> (Event -> *) -> (Event -> Event)
//setLocalStorage :: (Event -> *) -> (Event -> Event)
//meant to decorate an event handler with adding the current value (or whatever desired property)
//of the event target to local storage. Passing in null for the second param allows the
//decorated function to supply alternative values for setting to localStorage.
const setLocalStorage = (...args) => {
  let f = curry(typeGuard(['function', 'string'], (prop, v, func) => {
    return curry(1, function(e) {
      let arity2 = 'function' === typeof v;
      let val    = arity2 ? 'value' : v;
      let fn     = arity2 ? v : func;
      let result = fn.call(null, e), el = e.currentTarget || this; //google maps

      //second half is for labels
      let key = el[prop] || el.parentNode.textContent.trim();
      let value = val === null ? result : _trim(el[val]);
      if (key != null && value != null) {
        localStorage.setItem(key, value);
      }
      return e;
    });
  }));

  switch (false) {
    case (!(args.length === 1)):
      if ('function' === typeof args[0]) {
        return f('label', 'value', args[0]);
      } else {
        return f(args[0]);
      }
    case (!(args.length === 2 && 'function' === typeof args[1])):
      let [value, fn] = args;
      return f('label', value, fn);
    default:
      return f(...args);
  }
};

//denodeify :: (* -> *) -> (* -> Promise *)
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

//bindA :: (* -> [*]) -> ([*] -> [*])
//Note about context, if you pass initial arguments besides the function to be decorated the
//context will be bound at that time.
const bindA = curry(1, _fnFirst(function(...args) {
  let [fn, ...initArgs] = args;
  let f = function(fnArgs) {
    let result = fn.apply(this, fnArgs);
    return _isArray(result) ? result : [result];
  };
  return initArgs.length ? f.apply(this, initArgs) : f;
}));

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

const parallelize = ((template) => {
  return typeGuard(['function', 'string', 'Blob', Array], (arg) => {
    let blob = (function() {
      switch (false) {
        case(!(arg instanceof Blob)): return arg;
        case(!(_isArray(arg))): return new Blob(arg);
        case(!('function' === typeof arg)):
        case(!('string') === typeof arg):
          return new Blob([template(arg)]);
      }
    })();
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
  });
})((str) => `onmessage = function(e) { postMessage((${str})(e.data)) }`);

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
  bindA,
  loopP,
  timeoutP,
  parallelize,
  padInt,
};
