"use strict";
const express = require('express'),
  path = require('path'),

  favicon = require('serve-favicon'),
  logger = require('morgan'),
  bodyParser = require('body-parser'),
  ipfilter = require('express-ipfilter'),
  routes = require('./controllers/index'),
  ElasticUpdater = require('./elasticSearch/updater/elasticUpdater'),
  elasticImporter = require('./elasticSearch/elasticImporter'),
  modelTest = require('./models/test'),
  util = require('util'),
  service = require('./elasticSearch/elasticService'),
  app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// a first middleware, a logger in console, just to show ip
app.use(function (req, res, next) {
  console.log('%s %s from %s , proxy: %s', req.method, req.url, req.ip, util.inspect(req.ips));
  next();
});

//Whitelisting certain IP addresses, while denying all other IPs:
//Postman and local host

var ips = ['::ffff:127.0.0.1','::1',' ::ffff:127.0.0.1', '127.0.0.1'];
app.use(ipfilter(ips, { mode: 'allow' }));


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

//Set CORS headers
app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token');
  // When performing a cross domain request, you will recieve
  // a preflighted request first. This is to check if our the app is safe.
  if (req.method == 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use('/', routes);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
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
} else if (process.argv[2] === "crawl") {
  modelTest.crawlFoler("../indexedDocuments")
    .then(function (nbr) {
      console.log(nbr + "doc updated");
    });
  //Remove from prod
} else if (process.argv[2] === "restart") {
  modelTest.restart_db().then(function (mes) {
    console.log(mes);
    service.buildElastic()
      .then(function () {
        console.log("clean");
      })
      .catch(function (err) {
        console.log(err);
      });
  })
    .catch(function (err) {
      console.log(err);
    });
} else {
  //singleton : test
  let eu = new ElasticUpdater();
  console.log(eu.time);
  setTimeout(function () {
    let eu = new ElasticUpdater();
    console.log(eu.time);
  }, 4000);
  eu.executeUpdate();
}



module.exports = app;
