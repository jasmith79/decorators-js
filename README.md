# decorators-js
Common javascript decorators I use. You'll note some omissions like `memoize`. I use the
[Ramda](http://ramdajs.com/0.19.0/index.html) library quite frequently and did not feel the need to
duplicate their excellent work (although the module does not *depend* on Ramda.

##Testing

Uses a combination of jasmine and phantomjs. Note that phantomjs is not entirely compliant yet. I've
polyfilled as much as possible, but some tests can't be run in phantomjs. Also there are a few node-specific tests. So to cover all bases:

* Kitchen sink version, does all of the below: type `make test`.
* Simple version, covers most tests, type `make phantom` to run tests with phantomjs
* Node version type `make jasmine`.
* Alternatively for a browser test of your choice, type `make serve` and point your browser
  at [localhost:8080](http://localhost:8080).

Whichever way you choose, any skipped tests should be logged to the console.

##API

###maybe
  * `maybe :: (* -> a) -> (* -> a)`
  * `maybe :: (* -> a) -> (Null -> Null)`

  Returns `null` if any of its arguments are `null` or `undefined`, otherwise returns the result
  of applying the passed-in function to the arguments. If the passed-in function has an arity of
  0 it may be successfully called with no arguments.

###debounce
  * `debounce :: Number -> (* -> Null) -> Number`
  * `debounce :: Number -> Boolean -> (* -> Null) -> Number`

  Delay in milliseconds. Returns the timer ID so caller can cancel. The optional boolean parameter
  is whether the function fires on the leading edge or trailing edge (defaults to false).

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
  * `setLocalStorage :: String -> String -> (Event -> *) -> (Event -> Event)`
  * `setLocalStorage :: String -> (Event -> *) -> (Event -> Event)`
  * `setLocalStorage :: (Event -> *) -> (Event -> Event)`

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

###bindA
`bindA :: (* -> [*]) -> ([*] -> [*])`

  Bind function for arrays. Note about context, if you pass initial arguments besides the function
  to be decorated the context will be bound at that time.

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

  \*\* **WARNING: not IE compatible.** I know of no way to do an inline worker in IE.\*\*

  Runs the passed-in function in a [Web worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). Note that Workers take
  basically one argument in a message, so although `parallelize` will gather the arguments into an
  array for you if you wish to your function to handle multiple arguments the function needs to
  expect an array/object. Note also that the function is string-serialized, meaning no `bindA`
  unfortunately.

###padInt
  * `padInt :: (* -> Number) -> (* -> String)`
  * `padInt :: Number -> (* -> Number) -> (* -> String)`
  * `padInt :: Number -> Number -> String`

  Pads the numeric results of the passed-in function with leading zeros up to the given length
  (defaults to 2). Can also work as a standalone function if passed two numbers.
