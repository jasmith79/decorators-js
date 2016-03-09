#!/usr/bin/env node
var http = require('http');
var fs   = require('fs');
var d    = require('../dist/decorators.min.js');
//var dir  = '/Users/jared/Dev/decorators-js';
var dir  = '.';
var read = d.denodeify(fs.readFile);
var server = http.createServer(function(req, res) {
  //this is terrible, but simple enough for testing
  var reqPath = dir + req.url;
  var path = reqPath === './' ? './spec/index.html' : reqPath;
  var p = read(path, 'utf-8');
  p.then(function(fstr) {
    res.end(fstr);
  }).catch(function(e) {
    res.statusCode = 404;
    res.end('File not found');
  });
});
server.listen(8080, function() {
  console.log('Listening at localhost 8080');
});
