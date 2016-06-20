"use strict";
//BDD style assertions for node.js
var should = require('should');

var assert = require('assert');
//for HTTP assertions 
var request = require('supertest');
var pgp = require('pg-promise')();


var db = require('../helper/db').db;
var document = require('../models/document');
var update = require('../models/update');
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
    testModel.restart_db().then(function () {
      testModel.insertFolder("root").then(function () {
        done()
      }).catch(onError)
    }).catch(onError)
  })

  // use describe to give a title to your test suite
  describe('Document', function () {
    it("should add entry 'I' into update when file insert", function (done) {
      //console.log(testModel.insertFileVersion());
      testModel.insertFileInFolder("root", fileLabel, "indexedDocument/departM2.pdf").then(function (row) {
        var log_data_version_id = row.log_data_id;

        update.getUpdates().then(function (rows) {
          rows.should.have.length(1);
          rows[0].op.should.equal('I');
          rows[0].update_id.should.equal(log_data_version_id);
          done();
        }).catch(onError)

      }).catch(onError)

    });

    it("should add entry 'I' into update when new file version insert for the same file", function (done) {
      //TODO can be better here
      testModel.insertFileVersionByFileLabel(fileLabel, "indexedDocument/MORACedric_English_CV.pdf").then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(2);
          rows[1].op.should.equal('I');
          done();
        }).catch(onError)

      }).catch(onError)
    });

    it("should add entry 'U' into update when file version is update for the same file", function (done) {
      testModel.getVersionIdByFileLabel(fileLabel).then(function (rows) {
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

  describe('Layout', function () {

    var layout_id = 0;
    before(function (done) {
      testModel.restart_db().then(function () {
        done();
      }).catch(onError)
    })

    it("should not add entry into update if layout create", function (done) {
      testModel.insertLayout().then(function (row) {
        layout_id = row.layout_id;
        update.getUpdates().then(function (rows) {
          rows.should.have.length(0);
          done();
        }).catch(onError)
      }).catch(onError)

    });

    it("should add entry 'U' into update if layout update", function (done) {
      testModel.updateLayout(layout_id, 'test').then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(1);
          rows[0].op.should.equal('U');
          done();
        }).catch(onError)
      }).catch(onError)

    });
    //Question : delete layout , cascade ?

  });

  describe('PinBoard', function () {
    var layout_id = 0;
    var pinboardId = 0;

    //Insert layout 
    before(function (done) {
      this.timeout(3000);
      testModel.clean_db().then(function () {
        testModel.insertLayout().then(function (row) {
          layout_id = row.layout_id;
          done();
        }).catch(onError)
      }).catch(onError)
    })


    it("should not add entry into update when pinboard insert", function (done) {
      //Set timeOut prevent deadLock
      setTimeout(function () {
        testModel.insertPinBoard("superPinBoardLabel", layout_id, 1).then(function (row) {
          pinboardId = row.pinboard_id;
          update.getUpdates().then(function (rows) {
            rows.should.have.length(0);
            done();
          }).catch(onError)
        }).catch(onError)
      }, 0);
    });


    it("should add entry 'U' into update if pinboard update", function (done) {
      testModel.updatePinBoard(pinboardId, 'testLable').then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(1);
          rows[0].op.should.equal('U');
          done();
        }).catch(onError)
      }).catch(onError)

    });

  });


  describe('Pin', function () {
    var layout_id = 0;
    var pinboardId = 0;
    var pin_id = 0;

    //Insert layout 
    before(function (done) {
      this.timeout(3000);
      testModel.clean_db().then(function () {
        testModel.insertLayout().then(function (row) {
          layout_id = row.layout_id;
          testModel.insertPinBoard("superPinBoardLabel", layout_id, 1).then(function (row) {
            pinboardId = row.pinboard_id;
            done();
          }).catch(onError)

        }).catch(onError)
      }).catch(onError)
    })


    it("should add entry 'I' into update when pin insert", function (done) {
      //Set timeOut prevent deadLock
      setTimeout(function () {
        testModel.insertPin(pinboardId, "super contenu", 1).then(function (row) {
          pin_id = row.pin_id;
          update.getUpdates().then(function (rows) {
            rows.should.have.length(1);
            rows[0].op.should.equal('I');
            done();
          }).catch(onError)
        }).catch(onError)
      }, 0);
    });

    it("should add entry 'U' into update when pin updated ans size 1", function (done) {
      //Set timeOut prevent deadLock
      testModel.updatePin(pin_id, "superdjdjdj contenu").then(function () {
        update.getUpdates().then(function (rows) {
          rows.should.have.length(1);
          rows[0].op.should.equal('U');
          done();
        }).catch(onError)
      }).catch(onError)
    });



  });

  describe('Pin vote', function () {
    var layout_id = 0;
    var pinboardId = 0;
    var pin_id = 0;

    //Insert layout 
    before(function (done) {
      this.timeout(3000);
      testModel.clean_db().then(function () {
        testModel.insertLayout().then(function (row) {
          layout_id = row.layout_id;
          testModel.insertPinBoard("superPinBoardLabel", layout_id, 1).then(function (row) {
            pinboardId = row.pinboard_id;
            done();
          }).catch(onError)

        }).catch(onError)
      }).catch(onError)
    })

  });


});

