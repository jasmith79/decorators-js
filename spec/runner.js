//borrowed from https://github.com/qindio/headless-jasmine-sample/blob/master/spec/SpecRunner.js

if (navigator.userAgent.indexOf("PhantomJS") > 0) {
  var consoleReporter = new jasmineRequire.ConsoleReporter()({
    showColors: true,
    timer: new jasmine.Timer,
    print: function() {
      console.log.apply(console, arguments)
    }
  });

  jasmine.getEnv().addReporter(consoleReporter);
}
