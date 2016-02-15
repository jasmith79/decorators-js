#!/usr/bin/env coffee

###
Unit tests for decorators.js
#@author Jared Smith, INDOT Web Application Developer
###

#catchHandler :: Error -> Null
#meant to be called as catch clause of Promise chain
catchHandler = (err) ->
  console.log err
  return null

### Includes ###

d = require '../decorators.js'
assert = require 'assert'

### Tests ###

describe 'onlyIf', ->
  it 'should not run when some args are null/undefined, otherwise run', ->
    sideEffect = null
    gives3 = d.onlyIf (a) -> 3
    emptyOk = d.onlyIf -> 4
    method =
      num: 3
      add: d.onlyIf (n) -> n + this.num
    testNum = 0
    assert.equal 3, gives3(15)
    assert.equal 3, gives3('foo')
    assert.equal 3, gives3({})
    assert.equal null, gives3(null)
    assert.equal null, gives3()
    assert.equal null, gives3(4, null)
    assert.equal null, gives3(4, undefined)
    d.onlyIf(-> sideEffect = 2)(null)
    assert.equal null, sideEffect
    assert.equal null, emptyOk(null)
    assert.equal 4, emptyOk()
    assert.equal 7, method.add(4)
    assert.equal null, method.add()

describe 'setLocalStorage', ->
  it 'should cache the result of an event handler in localStorage', ->
    #stub out localStorage
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
    method =
      num: 0
      inc: d.debounce 500, -> this.num += 1

    f()
    f() #should be ignored
    f() #should be ignored
    method.inc()
    method.inc() #should be ignored
    method.inc() #should be ignored
    setTimeout (->
      assert.equal 1, counter
      assert.equal 1, method.num
      done()), 1000

describe 'log', ->
  it 'Should work for methods', ->
    obj =
      method: d.log -> this

    assert.equal obj, obj.method()

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

#Need to mock Blob for node tests
# describe 'workerify', ->
#   it 'should run passed in function in a separate thread', (done) ->
#     factorialWorker = d.workerify (n) ->
#       i = n
#       ans = 1
#       if n < 0 then throw new Error 'Invalid input for factorial'
#       `for (i; i != 0; i--) {
#         ans *= i;
#       }`
#       return ans
#
#     passes = factorialWorker 10
#     passes
#       .then (val) ->
#         assert.equal val, 3628800
#         return factorialWorker -1
#       .then(
#         ((val) ->
#           #this should never run?
#           assert.ok false),
#         ((err) ->
#           assert.ok (err instanceof Error)
#           assert.equals err.message, 'Invalid input for factorial')
#           done())

describe 'unNew', ->
  it 'Should allow a constructor function to be `apply`ed', ->
    januaryFirst2015 = 1422766800000
    arr = [2015, 1, 1]
    dater = d.unNew Date
    allAtOnce = d.unNew Date, 2015, 1, 1
    time1 = dater.apply(null, arr).getTime()
    time2 = allAtOnce.getTime()
    assert.equal time1, januaryFirst2015
    assert.equal time2, januaryFirst2015

    method =
      Foo: -> this.a = 3

    foo = d.unNew(method.Foo)()
    assert.ok foo instanceof method.Foo
    assert.equal foo.a, 3

describe 'unGather', ->
  it 'Conditionally unnests rest parameters', ->
    fn = d.unGather (args...) -> args.reduce(((acc, x) -> acc + x), 0)
    assert.equal fn(1,2,3), fn([1,2,3])
    obj =
      foo: 0
      method: d.unGather (args...) -> this.foo = args.reduce(((acc, x) -> acc + x), 0)

    obj.method 1,2,3
    assert.equal obj.foo, 6
    obj.foo = 0
    obj.method [1,2,3]
    assert.equal obj.foo, 6

describe 'trampoline', ->
  it 'Eliminates tail calls', ->
   `var factorial = function(n) {
      var _factorial = d.trampoline( function myself (acc, n) {
        return n > 0
        ? function () { return myself(acc * n, n - 1); }
        : acc
      });

      return _factorial(1, n);
   };`

   assert.equal(factorial(32000), Infinity)
