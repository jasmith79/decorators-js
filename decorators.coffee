#!/usr/bin/env coffee

###
Common decorators
#@author Jared Smith
###

_global = switch
  when window? then window
  when global? then global
  when this?   then this
  else {}

MOD_NAME = 'Decorators'
MOD_SYSTEM = switch
  when module? and module.exports? and typeof require is 'function'   then 'commonJS'
  when typeof requirejs is 'function' and typeof define is 'function' then 'AMD'
  when System? and typeof System.import is 'function'                 then 'systemJS'
  else null

### Utils ###

#include :: String, String -> a
include = (identifier, property = identifier) -> switch MOD_SYSTEM
  when 'commonJS' then require identifier
  when 'AMD'      then throw new Error "Asynchronous Modules not supported"
  when 'systemJS' then _global.System.import identifier
  else (_global[property] or
    throw new Error "Unable to import module #{identifier}, no global property #{property}")

#extern :: a -> Null
extern = (a) ->
  switch MOD_SYSTEM
    when 'commonJS' then module.exports = a
    when 'AMD'      then throw new Error "Asynchronous Modules not supported"
    when 'systemJS' then _global.System.set MOD_NAME, System.newModule(a)
    else _global[MOD_NAME] = a

#getFnName :: a -> b -> String
#Has IE workaround for lack of function name property on Functions
getFnName = (fn) ->
  if typeof fn isnt 'function' then throw new Error "Non function passed to getFnName"
  return if fn.name? then fn.name else fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]


### Decorators ###


#onlyIf :: a -> b -> a -> b
#onlyIf :: a -> b -> Null -> Null
#onlyIf :: [a] -> b -> [a] -> b
#onlyIf :: [a] -> b -> [Null] -> Null
onlyIf = (fn, thisArg = null) -> (args...) ->
  test   = if args.length is 1 and Array.isArray args[0] then args[0] else args
  passed = if fn.length and test.length is 0 then false else test.every((x) -> x?)
  return if passed then fn.apply thisArg, args else null

#debounce :: Int -> (a -> Null) -> Int
#Delay in milliseconds. Returns the timer ID so caller can cancel
debounce = (delay, fn) ->
  if not delay? then throw Error "Function debounce called with no timeout."
  timer   = null
  context = if this is _global then null else this
  func    = (args...) ->
    clearTimeout timer
    timer = setTimeout (-> fn.apply context, args), delay
    return timer

  return if fn? then func else (fnArg) -> debounce(delay, fnArg)

#throttle :: Int -> (a -> Null) -> Int
#Delay in milliseconds. Returns the timer ID so caller can cancel
throttle = (delay, fn) ->
  if not delay? then throw Error "Function throttle called with no timeout."
  last    = null
  timer   = null
  context = if this is _global then null else this
  func    = (args...) ->
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
log = (fn) => (args...) =>
  res = fn.apply this, args
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
denodeify = (fn, thisArg) ->
  return (args...) ->
    return new Promise (resolve, reject) ->
      fn.apply(thisArg, args.concat([
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

  return (timeout, fn) ->
    if not timeout? then throw new Error "Function timeoutP called with no timeout."

    func = (args...) -> new Promise (resolve, reject) ->
      promise = fn.apply null, args
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
#NOTE this method creates inline workers using URL Objects. The created URLs last the *lifetime* of
#the document. Beware ballooning memory footprint if you workerify fns on the fly.
workerify = (fn, thisArg = null) ->
  blob = new Blob ["onmessage = function(e) { postMessage((#{fn})(e)); })"]
  url = URL.createURLObject blob
  worker = new Worker(url)
  return (arg) ->
    worker.postMessage arg
    return new Promise (resolve, reject) ->
      listener = (e) ->
        worker.removeEventListener 'message', listener
        resolve e.data

      worker.addEventListener 'message', listener

extern {
  setLocalStorage
  onlyIf
  timeoutP
  debounce
  throttle
  denodeify
  log
  workerify
}
