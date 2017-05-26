# decorators-js

Common javascript decorators and combinators I use all the time. While I love libraries like Ramda
this is a lightweight poor man's alternative.

## API

### curry
  `n=f.length -> f: Function -> * -> *`

  Curries function `f` allowing arguments to be received piecemeal. Can be set to a specific arity,
  defaults to the arity of the curried function. Works for class constructors as well.

### maybe
  `(f: Function, strict=true) -> * -> null|*`

  Returns a function that returns `null` if any of its arguments are `null` or `undefined`,
  otherwise returns the result of applying the function to the arguments. If the passed-in function
  has an arity of 0 it may be successfully called with no arguments. If strict is set to false the
  pre-emptive null is only returned if *all* the arguments are `null` or `undefined`.

### debounce
  `(delay: Integer, immediate=false, f: Function) -> * -> Integer`

  Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
  is whether the function fires on the leading edge or trailing edge.

### throttle (curried)
  `delay: Integer -> f: Function -> * -> Integer`

  Throttles passed in function. Returns the `setTimeout` handle so caller can cancel.

### denodeify
  `f: Function -> * -> Promise<*>`

  Takes a function that accepts a nodejs-style (error-first) callback and returns a function that
  returns a Promise of the result instead. If the callback receives multiple non-error parameters
  then it will return a Promise of an array of the results.

### apply (curried)
  `f: Function -> args: Array<*> -> *`

  Takes a function that takes positional arguments and returns a function that takes an Array of
  arguments.

### applyConstructor (curried)
  `class: Class -> args: Array<*> -> Object`

  Allows a class constructor that takes positional arguments to be given an Array instead. Useful
  for mapping a constructor over an Array of initialization data.

### bindArity (curried)
  `n: Integer -> f: Function -> * -> *`

  Applies only the first `n` received arguments to `f`. Useful for e.g. mapping `parseInt` over an
  Array of Strings: `[1, 2, 3] === ["1", "2", "3"].map(d.bindArity(1, parseInt))`.

### unary

  A partial application of `bindArity` and 1.

### pipe
  `(f: Function, g: Function ...) -> * -> *`

  Forward function composition. All functions except the first should be unary.

### trampoline
  `f: Function -> * -> *`

  Uses bounded stack space to run thunk-returning tail-recursive functions.

### memoize
  `f: Function -> * -> *`

  Caches the result of function calls to avoid re-computation.

### bindPromise
  `f: Function -> Promise<*> -> Promise<*>`

  Takes a function `f` from `a -> b` or `a -> Promise b` and returns a function `Promise a -> Promise b`.