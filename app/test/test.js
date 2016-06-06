//BDD style assertions for node.js
var should = require('should');

var assert = require('assert');
//for HTTP assertions 
var request = require('supertest');
var pgp = require('pg-promise')();


var db = require('../helper/db').db;
var update = require('../models/update');
var document = require('../models/document');
var pin = require('../models/pin');
var testModel = require('../models/test');


var fileLabel = "superTest";
//process.env.NODE_ENV = process.env.NODE_ENV || 'development'

function onError(err) {
  console.error(err.message || err);
}


describe('Database Update', function () {
  // within before() you can run all the operations that are needed to setup your tests. In this case
  // I want to create a connection with the database, and when I'm done, I call done().
  before(function (done) {
    // In we clean and set the trigger for the bd
    //clear and build elastic index

    this.timeout(3000);
    testModel.clean_db().then(function (mess) {
      testModel.setTrigger().then(function () {
        document.insertFolder("root").then(function () {
          done()
        }).catch(onError)
      }).catch(onError)

    }).catch(onError)
  });

  // use describe to give a title to your test suite
  describe('Document', function () {
    it("should add entry 'I' into update when file insert", function (done) {
      //console.log(document.insertFileVersion());
      document.insertFileInFolder("root", fileLabel, "indexedDocument/api.pdf").then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(1);
          rows[0].op.should.equal('I');
          done();
        }).catch(onError)

      }).catch(onError)

    });
    
    it("should add entry 'I' into update when new file version insert for the same file", function (done) {
      //TODO can be better here
      document.insertFileVersionByFileLabel(fileLabel, "indexedDocument/api2.pdf").then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(2);
          rows[1].op.should.equal('I');
          done();
        }).catch(onError)

      }).catch(onError)
    });

    it("should modify entry 'U' into update when file version is update for the same file", function (done) {
      document.getVersionIdByFileLabel(fileLabel).then(function (rows) {
        rows.should.have.length(2);
        db.none("UPDATE file.version SET label =$1 WHERE version_id = $2",
          ["SuperTest", rows[1].version_id]).then(function () {
            update.getUpdates().then(function (rows) {
              rows.should.have.length(2);
              rows[1].op.should.equal('U');
              done();
            }).catch(onError)
          }).catch(onError)
        //Question : peut on update une version precedente

      }).catch(onError)
    });
  });

  describe('Pin', function () {

    it("should add entry 'I' into update when pin insert", function (done) {
        done();
    });
    
  });

});