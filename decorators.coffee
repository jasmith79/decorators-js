#!/usr/bin/env coffee

###
Common decorators
@author Jared Smith
Remember to compile with the -b (bare) flag!
###

((root, main) ->
  MOD_NAME = 'Decorators'
  switch
    when module? and module.exports?                then module.exports = main(root)
    when typeof define is 'function' and define.amd then define(main.bind(root, root))
    else root[MOD_NAME] = main(root)
)((if window? then window else null), (_global)->
  'use strict'

  _invalidArgumentError = new TypeError "Invalid argument"

  #_getFnName :: a -> b -> String
  #Has IE workaround for lack of function name property on Functions
  _getFnName = (fn) ->
    if typeof fn isnt 'function' then throw _invalidArgumentError
    return if fn.name? then fn.name else fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]

  #_isArray :: a -> Boolean
  #Has IE workaround for lack of Array.isArray
  _isArray = (a) -> (Object::toString.call(a) is "[object Array]") or (a instanceof Array)

  #_noGlobalCtx :: (* -> a) -> (* -> a)
  #Ensures passed-in function is not executed with global context set to `this`. Returned function
  #is automatically curried.
  _noGlobalCtx = (fn) ->
    if typeof fn isnt 'function' then throw _invalidArgumentError
    return curry fn.length, (args...) ->
      context = if this is _global then null else this
      return fn.apply context, args

  #curry ([a] -> a) -> ([a] -> a)
  #curry Int -> ([a] -> a) -> ([a] -> a)
  curry = do ->
    _curry = (fn, args...) -> (fnArgs...) -> fn.apply(this, args.concat(fnArgs))
    curry = (n, f) ->
      fn = null
      length = 0
      switch
        when f?
          (if typeof f isnt 'function' or typeof n isnt 'number' then throw _invalidArgumentError)
          [fn, length] = [f, n]
        when typeof n is 'function'
          [fn, length] = [n, n.length]
        when typeof n is 'number'
          `return function(fn) { return curry.call(this, n, fn); }`
        else
          throw _invalidArgumentError

      return (fnArgs...) ->
        context = if this is _global then null else this
        if fnArgs.length < length
          concated = [fn].concat fnArgs
          currLength = length - fnArgs.length
          val =
            if (currLength > 0)
              #curry(currLength, _curry.apply(this, concated))
              curry(currLength, _curry.apply(context, concated))
            else
              #_curry.apply(this, concated)
              _curry.apply(context, concated)
          return val
        else
          #fn.apply this, fnArgs
          fn.apply context, fnArgs

    return curry

  #unGather :: (* -> a) -> (* -> a)
  #Conditionally unnests the arguments to a function, useful for functions that use rest params to
  #gather args.
  unGather = (args...) =>
    [fn, initArgs...] = args
    if typeof fn isnt 'function' then throw _invalidArgumentError
    func = _noGlobalCtx (fnArgs...) ->
      params = if fnArgs.length is 1 and _isArray fnArgs[0] then fnArgs[0] else fnArgs
      return fn.apply this, params

    return if initArgs.length then func.apply this, initArgs else func

  #onlyIf :: (* -> a) -> (* -> a)
  #onlyIf :: (* -> a) -> (null -> null)
  onlyIf = (fn) ->
    if typeof fn isnt 'function' then throw _invalidArgumentError
    return _noGlobalCtx unGather (args...) ->
      passed  = if fn.length and args.length is 0 then false else args.every((x) -> x?)
      return if passed then fn.apply this, args else null

  #debounce :: Int -> (a -> Null) -> Int
  #Delay in milliseconds. Returns the timer ID so caller can cancel
  debounce = curry (delay, fn) ->
    timer = null
    return _noGlobalCtx (args...) ->
      clearTimeout timer
      timer = setTimeout (=> fn.apply this, args), delay
      return timer

  #throttle :: Int -> (a -> Null) -> Int
  #Delay in milliseconds. Returns the timer ID so caller can cancel
  throttle = curry (delay, fn) ->
    last = null
    timer = null
    return _noGlobalCtx (args...) ->
      now = Date.now()
      if last? and now < last + delay
        clearTimeout timer
        timer = setTimeout (=>
          last = now
          fn.apply this, args), delay

      else
        last = now
        fn.apply this, args

  #log :: (a -> a) -> [a] -> a
  log = (fn) -> curry fn.length, _noGlobalCtx (args...) ->
    res = fn.apply this, args
    str = switch typeof res
      when 'object' then JSON.stringify res
      when 'string' then res
      else res.toString()

    name = _getFnName(fn) or "Anonymous"
    calledArgs = if args.length then args else "none"
    console.log "Function #{name} called with arguments #{calledArgs} and yielded #{str}"
    return res

  #setLocalStorage :: (Event -> [String]), String, String -> (Event -> Event)
  #meant to decorate an event handler with adding the current value (or whatever desired property)
  #of the event target to local storage. The check on the return value of the function allows the
  #decorated function to supply alternative values for setting to localStorage.
  setLocalStorage = (fn, prop = 'label', val = 'value') -> (e) ->
    result = fn e

    #event handlers preeety much *never* return an array, so this should be fine
    if _isArray result
        [key, value] = result

    #if relevant data is not supplied by the fn we're decorating:
    #first clause is for paper-menus, second for paper-inputs
    key   ?= e.target[prop] or e.target.parentNode.innerText.trim()
    value ?= (switch typeof e.target[val]
        when 'string', 'undefined' then e.target[val]
        else e.target[val].toString()).trim()

    if key and value? then localStorage.setItem key, value
    return e

  #denodeify :: (* -> a) -> (* -> Promise a)
  denodeify = (fn) =>
    return _noGlobalCtx (args...) ->
      return new Promise (resolve, reject) ->
        fn.apply(this, args.concat([
          ((err, resArgs...) ->
            if err? then reject err
            res = switch resArgs.length
              when 0 then true
              when 1 then resArgs[0]
              else resArgs
            resolve res)]))

  #timeoutP :: Int -> (a -> Promise(b)) -> Promise(b)
  #timeout in milliseconds
  timeoutP = do ->
    err = new Error """
      Sorry it is taking an unusually long time to retrieve the data you requested. If you are not
      experiencing the awesome in the next few seconds, retry your request or reload the page.
      Sorry for any inconvenience."""

    return (timeout, fn) =>
      if not timeout? then throw new Error "Function timeoutP called with no timeout."

      func = (args...) ->
        context = if this is _global then null else this
        return new Promise (resolve, reject) ->
          promise = fn.apply context, args
          timer = setTimeout (-> reject err), timeout
          promise.then(
            ((val) ->
              clearTimeout testTimer
              clearTimeout timer
              resolve val),

            ((e) ->
              clearTimeout timer
              clearTimeout testTimer
              reject e))

          return null

      return if fn? then func else (fnArg) -> timeoutP timeout, fnArg

  #workerify :: (a -> a) -> (a -> Promise a)
  #Runs the passed in function in a Web Worker and returns a Promise of the result
  workerify = (fn) ->
    blob   = new Blob ["onmessage = function(e) { postMessage((#{fn})(e)); })"]
    url    = URL.createURLObject blob
    worker = new Worker(url)
    URL.revokeURLObject url
    return (arg) ->
      worker.postMessage arg
      return new Promise (resolve, reject) ->
        listener = (e) ->
          worker.removeEventListener 'message', listener
          resolve e.data

        worker.addEventListener 'message', listener

  #unNew :: (* -> {k:v}) -> (* -> {k:v})
  #Wraps a constructor so that it may be not only called without new but used with .apply(). Note
  #unlike ramda's `construct` the unNewed constructor is variadic.
  unNew = (initArgs...) ->
    [constructor, args...] = initArgs
    if not constructor? or typeof constructor isnt 'function' then throw _invalidArgumentError
    func = (fnArgs...) -> new (Function::bind.apply constructor, [constructor].concat(fnArgs))

    return if args.length then func.apply this, args else func

  #checkJSON :: JSON -> a
  #checkJSON :: JSON -> null
  checkJSON = (f) ->
    if typeof f isnt 'function' then throw _invalidArgumentError
    _notJSONError = new Error("Function #{getFnName f} should return a valid JSON string")
    fn = ifOnly _noGlobalCtx f
    return (args...) ->
      json = fn.apply this, args
      if typeof json isnt 'string' then throw _notJSONError
      return switch
        when json.length < 3, not json[0].match /[\[,\{,0-9,n,t,f]/i then null
        else JSON.parse json

  #runTime :: (* -> *) -> (* -> *)
  runTime = (f) ->
    fn = log f
    return (args...) ->
      console.time(getFnName f)
      res = fn.apply this, args
      console.timeEnd(getFnName f)
      return res

  return {
    setLocalStorage
    onlyIf
    timeoutP
    debounce
    throttle
    denodeify
    log
    workerify
    unNew
    unGather
    checkJSON
    runTime
  })
