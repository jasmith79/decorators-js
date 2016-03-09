# decorators-js
Common javascript decorators I use. You'll note some omissions like `memoize`. I use the
[Ramda](http://ramdajs.com/0.19.0/index.html) library quite frequently and did not feel the need to
duplicate their excellent work (although the module does not *depend* on Ramda, I implemented curry
internally).

Note that while I made the decorators work for methods to the extent that it was possible or
sensible they *will not* invoke the passed in function with the global object as context. So if
passed a top-level function in non-strict mode, the context will be `null` rather than `window` or
`global`. If you wish a function to be evaluated with `this` being the global meta-object you will
have to explicitly bind the context before handing it to the decorator.

##Testing

To run the tests that can be run in node, type `make test`. To run all tests including those that
require a browser, type `node spec/server.js` and point your browser at `localhost:8080`. NOTE:
both of these commands require being in the root project directory to properly resolve file paths.

##API

###maybe
  `maybe :: (* -> a) -> (* -> a)`
  `maybe :: (* -> a) -> (Null -> Null)`

  Returns `null` if any of its arguments are `null` or `undefined`, otherwise returns the result
  of applying the passed-in function to the arguments. If the passed-in function has an arity of
  0 it may be successfully called with no arguments.

###debounce
  `debounce :: Number -> (a -> Null) -> Number`

  Debounces passed in function. Returns the `setTimeout` handle so caller can cancel. NOTE: the
  debounced function is what underscore calls leading-edge, if there's no pending timeout the
  function is executed immediately.

###throttle
  `throttle :: Number -> (a -> Null) -> Number`

  Throttles passed in function. Returns the `setTimeout` handle so caller can cancel.

###log
  `log :: (a -> a) -> (a -> a)`

  Logs the name, arguments, and result to the console each time the passed-in function is called.

###denodeify
  `denodeify :: (* -> a) -> (* -> Promise a)`

  Takes a function that accepts a nodejs-style (error-first) callback and returns a function that
  returns a Promise of the result instead. If the callback receives multiple non-error parameters
  then it will return a Promise of an array of the results.

###unNew
  `unNew :: (* -> {k:v}) -> (* -> {k:v})`

  Similar to [Ramda's](http://ramdajs.com/0.19.0/index.html) `Construct`, `unNew` takes a
  Javascript constructor function and wraps it so that it functions properly when called without
  the `new` operator. Useful for (among other things) mapping a constructor over a list of
  configuration objects. NOTE: be careful when using with constructors that take optional
  parameters, especially built-ins. Date for instance has an arity of 7, but can be called with
  no arguments at all. Because the return function is curried, use in the following fashion:

  `let makeDate = decorators.unNew(0, Date);`

  Unless you want the currying.

###unGather
  `unGather :: ([*] -> *) -> ([[*]] -> *)`

  Conditionally unnests the argument to a function. Useful for functions that take rest parameters.
  Consider:
  ```javascript
  let foo = (...args) => {
    if (args.length < 3) {
      return foo([...args, 1,2,3]); //Oops, recursive call adds a layer of nesting!
    } else {
      return args.reduce(((acc, x) => acc + x;), 0);
    }
  }
  ```
  Certainly we could spread the array:
  ```javascript
  foo(...[...args, 1,2,3]));
  ```
  And for this simple case we should, but `unGather` provides an easy way to avoid this sort of
  error: when called with one argument that is an array it will automatically spread it for you.

###setLocalStorage
  `setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)`
  `setLocalStorage :: String -> (Event -> *) -> (Event -> Event)`
  `setLocalStorage :: (Event -> *) -> (Event -> Event)`

  Decorates event handlers so that the change in value is automatically logged to `localStorage`.
  Note that this function is **not** `debounced`/`throttled` by default, you will need to do so
  yourself. Also note that context is not preserved, if the meaning of `this` matters to your
  handler, bind it before passing it to the decorator.

###runtime
  `runtime :: (* -> a) -> (* -> a)`

  Logs the passed-in function's name, arguments, result, and run time in milliseconds. **NOTE**
  there is some extra overhead in the nested function calls. If a great deal of precision in
  measurement is required, you will want to put `console.time`/`console.timeEnd` directly in the
  code.

###curry
  `curry ([*] -> *) -> ([*] -> *)`
  `curry Number -> ([*] -> *) -> ([*] -> *)`

  Implemented it because I needed it internally and I've exposed it purely for convenience: I
  recommend using [Ramda's](http://ramdajs.com/0.19.0/index.html) or at least
  [lodash's](https://lodash.com/) `curry`. Curries the function either to the specified arity
  or the function's length property.

###typeGuard
  `typeGuard :: [String] -> (a -> *) -> (a -> *)`

  Takes a list of types to check against the first argument of the decorated function. Can test
  constructors, primitives, string types (e.g. 'function', 'boolean'), and will duck-type objects
  based on either their constructors name or their internal class property. Although this will
  not provide the same benefits as static type-checking, what it *does* do is eliminate the silent
  fail case: strings and arrays have many of the same methods, the `+` handles strings *and*
  numbers, `typeof null === 'object'`, etc.

###lift
  `lift :: (* -> a) -> (* -> *) -> (* -> a)`
  Generic lift function. Takes a type constructor for type a and wraps the return value of the
  passed-in function in type a. Type constructors should be guarded, for an example see liftP and
  liftA below. Note that if the function returns an *array* then array will be applied to the
  constructor, i.e. constructors requiring `new` should be wrapped in unNew.

###liftA
  `liftA :: (* -> *) -> (* -> [*])`

  Wraps the return value of the passed-in function in an array.

###liftP
  `liftP :: (* -> *) -> (* -> Promise *)`

  Wraps the return value of the passed-in function in a Promise.

###bindP
  `bindP :: (* -> Promise *) -> (Promise * -> Promise *)`

  Bind for the Promise (a.k.a Continuation) Monad.

###loopP
  `loopP :: (* -> *) -> (Null -> Promise *)`

  Starts a loop that continually calls the promise-returning function each time the previous
  iteration resolves with the value of that resolution. Useful for long-polling. Returns a function
  that when called breaks the loop and returns a Promise of last value. Can be used for asynchronous
  recursion (non-blocking).

###timeoutP
  `timeoutP :: Number -> (* -> Promise *) -> (* -> Promise *)`

  Rejects if the promise returned from the function takes longer than the given delay to resolve.
  Timeout in milliseconds.

###parallelize
  `parallelize :: (* -> *) -> (* -> *)`

  Runs the passed-in function in a [Web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). Note that Workers take
  basically one argument in a message, so although `parallelize` will gather the arguments into an
  array for you if you wish to your function to handle multiple arguments the function needs to
  expect an array/object. Note also that the function is string-serialized, meaning no `bindA`
  unfortunately.
