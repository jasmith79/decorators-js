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
Documentation coming soon
