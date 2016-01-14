# decorators-js
Common javascript decorators I use. You'll note some omissions like `memoize`. I use the
[Ramda](http://ramdajs.com/0.18.0/index.html) library quite frequently and did not feel the need to
duplicate their excellent work (although the module does not *depend* on Ramda, I implemented curry
internally).

Note that while I made the decorators work for methods to the extent that it was possible or
sensible they *will not* invoke the passed in function with the global object as context. So if
passed a top-level function in non-strict mode, the context will be `null` rather than `window` or
`global`. If you wish a function to be evaluated with `this` being the global meta-object you will
have to explicitly bind the context before handing it to the decorator.

##API

###onlyIf
  `onlyIf :: (* -> a) -> (* -> a)`
  `onlyIf :: (* -> a) -> (null -> null)`

  Returns `null` if any of its arguments are `null` or `undefined`, otherwise returns the result
  of applying the passed-in function to the arguments. If the passed-in function has an arity of
  0 it may be successfully called with no arguments.

###debounce
  `debounce :: Int -> (a -> Null) -> Int`

  Debounces passed in function. Returns the `setTimeout` handle so caller can cancel.

###throttle
  `throttle :: Int -> (a -> Null) -> Int`

  Throttles passed in function. Returns the `setTimeout` handle so caller can cancel.

###log
  `log :: (a -> a) -> (a -> a)`

  Logs the name, arguments, and result to the console each time the passed-in function is called.

###workerify
  `workerify :: (a -> a) -> (a -> Promise a)`

  Runs the passed-in function in a Web Worker. Returns a Promise of the result.

###denodeify
  `denodeify :: (* -> a) -> (* -> Promise a)`

  Takes a function that accepts a nodejs-style (error-first) callback and returns a function that
  returns a Promise of the result instead. If the callback receives multiple non-error parameters
  then it will return a Promise of an array of the results.

###unNew
  `unNew :: (* -> {k:v}) -> (* -> {k:v})`

  Similar to [Ramda's](http://ramdajs.com/0.18.0/index.html) `Construct`, `unNew` takes a
  Javascript constructor function and wraps it so that it functions properly when called without
  the `new` operator. Useful for (among other things) mapping a constructor over a list of
  configuration objects.

###unGather
  `unGather :: ([[a]] -> a) -> ([a] -> a)`

  Conditionally unnests the argument to a function. Useful for functions that take rest parameters.
  Consider:
  ```javascript
  let foo = (...args) => {
    if (args.length < 3) {
      return foo(args.concat([1,2,3])); //Oops, recursive call adds a layer of nesting!
    } else {
      return args.reduce(((acc, x) => acc + x;), 0);
    }
  }
  ```
  Certainly we could spread the array:
  ```javascript
  foo(...args.concat([1,2,3]));
  ```
  And for this simple case we should, but `unGather` provides an easy way to avoid this sort of
  error: when called with one argument that is an array it will automatically spread it for you.

###setLocalStorage
  `setLocalStorage :: (Event -> [String]), String, String -> (Event -> Event)`

  Decorates event handlers so that the change in value is automatically logged to `localStorage`.
  Note that this function is **not** `debounced`/`throttled` by default, you will need to do so
  yourself.

###checkJSON
  `checkJSON :: (* -> String) -> (* -> {k:v})`
  `checkJSON :: (* -> String) -> (* -> null)`

  Takes a function that returns a JSON string and attempts to verify that the string is valid before
  parsing. If the passed-in function returns a non-string, an error is thrown. If the function
  returns a string with length < 3 (i.e., empty response) or a string whose first character is not
  a valid first character for JSON returns `null`. Otherwise, attempts to parse the string and
  returns that value.

###runTime
  `runTime :: (* -> a) -> (* -> a)`

  Logs the passed-in function's name, arguments, result, and run time in milliseconds. **NOTE**
  there is some extra overhead in the nested function calls. If a great deal of precision in
  measurement is required, you will want to put `console.time`/`console.timeEnd` directly in the
  code.

###curry
  `curry ([a] -> a) -> ([a] -> a)`
  `curry Int -> ([a] -> a) -> ([a] -> a)`

  Implemented it because I needed it internally and I've exposed it purely for convenience: I
  recommend using [Ramda's](http://ramdajs.com/0.18.0/index.html) or at least 
  [lodash's](https://lodash.com/) `curry`.
