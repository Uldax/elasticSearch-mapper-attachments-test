var express = require('express');
var path = require('path');

var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var ipfilter = require('express-ipfilter');
var routes = require('./controllers/index');
var elasticUpdater = require('./elasticSearch/updater/elasticUpdater');
var elasticImporter = require('./elasticSearch/elasticImporter');
var testM = require('./models/test');
var util = require('util');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// a first middleware, a logger in console, just to show ip
app.use(function(req, res, next){
  console.log('%s %s from %s , proxy: %s', req.method, req.url, req.ip, util.inspect(req.ips));
  next();
});

//Whitelisting certain IP addresses, while denying all other IPs:
//Postman and local host
var ips = ['::ffff:127.0.0.1','127.0.0.1'];
app.use(ipfilter(ips, {mode: 'allow'}));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components',  express.static(__dirname + '/bower_components'));
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


//Set up elastic updater
//Warning may be heavy
if (process.argv[2] === "import") {
    console.log("Import Process ..");
    elasticImporter.start();
}
else{
    elasticUpdater.start();
    //testM.crawlFoler("../indexedDocuments");
}



module.exports = app;
