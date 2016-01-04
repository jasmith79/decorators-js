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

  #getFnName :: a -> b -> String
  #Has IE workaround for lack of function name property on Functions
  getFnName = (fn) ->
    if typeof fn isnt 'function' then throw new Error "Non function passed to getFnName"
    return if fn.name? then fn.name else fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]

  #onlyIf :: a -> b -> a -> b
  #onlyIf :: a -> b -> Null -> Null
  #onlyIf :: [a] -> b -> [a] -> b
  #onlyIf :: [a] -> b -> [Null] -> Null
  onlyIf = (fn) => (args...) ->
    test    = if args.length is 1 and Array.isArray args[0] then args[0] else args
    passed  = if fn.length and test.length is 0 then false else test.every((x) -> x?)
    context = if this is _global then null else this
    return if passed then fn.apply context, args else null

  #debounce :: Int -> (a -> Null) -> Int
  #Delay in milliseconds. Returns the timer ID so caller can cancel
  debounce = (delay, fn) =>
    if not delay? then throw Error "Function debounce called with no timeout."
    timer   = null
    func    = (args...) ->
      context = if this is _global then null else this
      clearTimeout timer
      timer = setTimeout (-> fn.apply context, args), delay
      return timer

    return if fn? then func else (fnArg) -> debounce(delay, fnArg)

  #throttle :: Int -> (a -> Null) -> Int
  #Delay in milliseconds. Returns the timer ID so caller can cancel
  throttle = (delay, fn) =>
    if not delay? then throw Error "Function throttle called with no timeout."
    last    = null
    timer   = null
    func    = (args...) ->
      context = if this is _global then null else this
      now = Date.now()
      if last? and now < last + delay
        clearTimeout timer
        timer = setTimeout (->
          last = now
          fn.apply context, args), delay

      else
        last = now
        fn.apply context, args

      return timer

    return if fn? then func else (fnArg) -> throttle(delay, fnArg)

  #log :: (a -> a) -> [a] -> a
  log = (fn) => (args...) ->
    context = if this is _global then null else this
    res = fn.apply context, args
    logged = switch typeof res
      when 'object' then JSON.stringify res
      when 'string' then res
      else res.toString()

    console.log "Function #{getFnName fn} called with arguments #{args} and yielded #{res}"
    return res

  #setLocalStorage :: (Event -> [String]), String, String -> Event -> Event
  #meant to decorate an event handler with adding the current value (or whatever desired property) of
  #the event target to local storage. The check on the return value of the function allows the
  #decorated function to supply alternative values for setting to localStorage.
  setLocalStorage = (fn, prop = 'label', val = 'value') -> (e) ->
    result = fn e

    #event handlers preeety much *never* return an array, so this should be fine
    if Array.isArray result
        [key, value] = result

    #if relevant data is not supplied by the fn we're decorating:
    #first clause is for paper-menus, second for paper-inputs
    key   ?= e.target[prop] or e.target.parentNode.innerText.trim()
    value ?= (switch typeof e.target[val]
        when 'string', 'undefined' then e.target[val]
        else e.target[val].toString()).trim()

    if key and value? then localStorage.setItem key, value
    return e

  #denodeify :: (a -> b) -> [a] -> Promise b
  denodeify = (fn) =>
    return (args...) ->
      context = if this is _global then null else this
      return new Promise (resolve, reject) ->
        fn.apply(context, args.concat([
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

  #workerify :: (a -> b) -> (a -> b)
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

  #unNew :: (a -> b) -> [a] -> b
  #Wraps a constructor so that it may be not only called without new but used with .apply(). Note
  #unlike ramda's `construct` the unNewed constructor is variadic.
  unNew = do ->
    argErr = new Error "Invalid argument to function unNew"
    return (initArgs...) ->
      [constructor, args...] = initArgs
      if not constructor? or typeof constructor isnt 'function' then throw argErr
      func = (fnArgs...) -> new (Function::bind.apply constructor, [constructor].concat(fnArgs))

      return if args.length then func.apply context, args else func

  #unGather :: a -> b -> [a] -> b
  #Conditionally unnests the arguments to a function, useful for functions that use rest params to gather args.
  unGather = do ->
    argErr = new Error "Invalid argument to function applied"
    return (args...) =>
      [fn, initArgs...] = args
      if typeof fn isnt 'function' then throw argErr
      func = (fnArgs...) ->
        context = if this is _global then null else this
        params = if fnArgs.length is 1 and Array.isArray fnArgs[0] then fnArgs[0] else fnArgs
        return fn.apply context, params

      return if initArgs.length then func.apply this, initArgs else func

  #checkJSON :: JSON -> a
  #checkJSON :: JSON -> null
  checkJSON = (json) ->
    return switch
      when typeof json isnt 'string', json.length < 3, json.match /fail/i then null
      else JSON.parse json

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
  })
