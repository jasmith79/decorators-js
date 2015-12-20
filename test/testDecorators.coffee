#!/usr/bin/env coffee

###
Unit tests for decorators.js
#@author Jared Smith, INDOT Web Application Developer
###

_global = switch
  when window? then window
  when global? then global
  when this? then this
  else {}

MOD_NAME = 'Test'
MOD_SYSTEM = switch
  when module? and module.exports? and typeof require is 'function' then 'commonJS'
  when typeof requirejs is 'function' and typeof define is 'function' and define.amd? then 'AMD'
  when System? and typeof System.import is 'function' then 'systemJS'
  else null

### Utils ###

#include :: String, String -> a
include = (identifier, property = identifier) -> switch MOD_SYSTEM
  when 'commonJS' then require identifier
  when 'AMD' then throw new Error "Asynchronous Modules not supported"
  when 'systemJS' then _global.System.import identifier
  else (_global[property] or
    throw new Error "Unable to import module #{identifier}, no global property #{property}")

#extern :: a -> Null
extern = (a) ->
  switch MOD_SYSTEM
    when 'commonJS' then module.exports = a
    when 'AMD' then throw new Error "Asynchronous Modules not supported"
    when 'systemJS' then _global.System.set MOD_NAME, System.newModule(a)
    else _global[MOD_NAME] = a

#catchHandler :: Error -> Null
#meant to be called as catch clause of Promise chain
catchHandler = (err) ->
  console.log err
  return null

#padInt :: Float -> String
padInt = (num) -> if num > 9 then num.toString() else '0' + num

#capFirst :: String -> String
capFirst = (str) -> str.slice(0, 1).toUpperCase() + str.slice(1)

#getFnName :: a -> b -> String
#Has IE workaround for lack of function name property on Functions
getFnName = (fn) ->
  if typeof fn isnt 'function' then throw new Error "Non function passed to getFnName"
  return if fn.name? then fn.name else fn.toString().match(/^\s*function\s*(\S*)\s*\(/)[1]


### Includes ###

d = include '../decorators.js', 'decorator'
assert = require 'assert'

### Tests ###

describe 'onlyIf', ->
  it 'should not run when some ar#should be ignoredgs are null/undefined, otherwise run', ->
    sideEffect = null
    gives3 = d.onlyIf (a) -> 3
    emptyOk = d.onlyIf -> 4
    assert.equal 3, gives3(15)
    assert.equal 3, gives3('foo')
    assert.equal 3, gives3({})
    assert.equal null, gives3(null)
    assert.equal null, gives3([null])
    assert.equal null, gives3([])
    assert.equal null, gives3()
    assert.equal null, gives3(4, null)
    assert.equal null, gives3(4, undefined)
    d.onlyIf(-> sideEffect = 2)(null)
    assert.equal null, sideEffect
    assert.equal null, emptyOk(null)
    assert.equal 4, emptyOk()

describe 'setLocalStorage', ->
  it 'should cache the result of an event handler in localStorage', ->
    `localStorage = {
       _store: {},
       getItem: function(k) { return this._store[k]; },
       setItem: function(k, v) {
         this._store[k] = v;
         return this;
       }
    };`
    handler = d.setLocalStorage (e) -> null
    arrHandler = d.setLocalStorage (e) -> [e.target.foo, e.target.bar]

    event =
      target:
        foo: 'foo'
        bar: 3
        label: 'qux'
        value: 5

    assert.equal event, handler(event)
    assert.equal 5, localStorage.getItem 'qux'
    assert.equal event, arrHandler(event)
    assert.equal 3, localStorage.getItem 'foo'

describe 'throttle', ->
  it 'should not fire again immediately in the waiting period', (done) ->
    onlyAfter500 = d.throttle 500
    counter = 0
    f = onlyAfter500 -> counter += 1
    f()
    setTimeout f, 100 #should be delayed
    setTimeout (-> assert.equal 1, counter), 101
    setTimeout (->
      assert.equal 2, counter
      done()), 1000

describe 'debounce', ->
  it 'Repeated invocations in the wait get dropped', (done) ->
    onlyAfter500 = d.debounce 500
    counter = 0
    f = onlyAfter500 -> counter += 1
    f()
    f() #should be ignored
    f() #should be ignored
    setTimeout (->
      assert.equal 1, counter
      done()), 1000

describe 'timeoutP', ->
  it 'Should fail a promise if it takes longer than the timeout to resolve', (done) ->
    halfSecond = d.timeoutP 200
    passes = halfSecond -> return Promise.resolve(true)
    fails = halfSecond -> return new Promise (resolve) -> setTimeout (-> console.log('done'); resolve true), 500
    passes()
      .then (v) ->
        assert.ok v
        return fails()
      .then null, (e) ->
        assert.ok (e instanceof Error)
        done()

describe 'denodeify', ->
  it 'should turn a callback accepting fn into a promise returning one', (done) ->
    fn1 = (one, two, cb) -> cb null, one + two
    fn2 = (cb) -> cb new Error 'some err'
    fn3 = (one, two, cb) -> cb null, one, two

    passes = d.denodeify(fn1)(4, 5)
    fails  = d.denodeify(fn2)()
    multi  = d.denodeify(fn3)(1, 2)

    passes
      .then (v) ->
        assert.equals v, 9
        return fails
      .then null, (e) ->
        assert.ok (e instanceof Error)
        return multi
      .then (v) ->
        [one, two] = v
        assert.equal one, 1
        assert.equal two, 2
        done()

describe 'workerify', ->
  it 'should run passed in function in a separate thread', (done) ->
    factorialWorker = d.workerify (n) ->
      i = n
      ans = 1
      if n < 0 then throw new Error 'Invalid input for factorial'
      `for (i; i != 0; i--) {
        ans *= i;
      }`
      return ans

    passes = factorialWorker 10
    passes
      .then (val) ->
        assert.equal val, 3628800
        return factorialWorker -1
      .then(
        ((val) ->
          #this should never run?
          assert.ok false),
        ((err) ->
          assert.ok (err instanceof Error)
          assert.equals err.message, 'Invalid input for factorial')
          done())
