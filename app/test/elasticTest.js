var conf = require("../config");
var mapping = require("../elasticMapping");
//BDD style assertions for node.js
var should = require('should');

var assert = require('assert');
//for HTTP assertions 
var request = require('supertest');


var elasticSearchPort = conf.elastic.port,
    protocol = conf.elastic.protocol,
    serverIp = conf.elastic.serverIp,
    indexName = "opus",
    typeName = "document",
    folderName = "indexedDocuments",
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort;
elasticPath = indexName + "/" + typeName;

var document = require('../models/document');
var updater = require('../helper/elasticUpdater');
var service = require('../helper/elasticService');
var update = require('../models/update');
var testModel = require('../models/test');
var fileLabel = "superTest";

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: serverIp + ":" + elasticSearchPort,
    log: 'error'
});


var myDocPath = "indexedDocuments/MORACedric_English_CV.pdf";

function onError(err) {
    console.log(err.message || err);
}


function createIndex() {
    return Promise.resolve()
        .then(function () {
            return client.indices.create({ index: "opus" });
        })
        .then(function () {
            return client.indices.putMapping({ index: "opus", type: 'document', body: mapping.documentMapping });
        })
        .then(function () {
            return client.indices.putMapping({ index: "opus", type: 'pin', body: mapping.pinMapping });
        })
        .catch(function (err) {
            console.log(err.message || err);
        });
}



describe('Elastic Search', function () {
    before(function (done) {
        //Destroy and recreate the index and mapping
        client.indices.exists({ index: "opus" }).then(function (exist) {
            if (exist) {
                client.indices.delete({ index: "opus" }).then(function () {
                    createIndex().then(function () {
                        done();
                    })
                });
            } else {
                createIndex().then(function () {
                    done();
                })
            }
        })

    });

    it("Serveur should respond ping", function (done) {
        this.timeout(3000);
        service.ping().then(function () {
            done();
        }).catch(onError)
    });

    describe('Elastic updater', function () {
        before(function (done) {
            // In we clean and set the trigger for the bd
            testModel.restart_db().then(function () {
                document.insertFolder("root").then(function () {
                    done()
                }).catch(onError)
            }).catch(onError)
        })

        describe('Document update', function () {

            it("Document update should be remove after tracker and add field in elastic", function (done) {
                this.timeout(8000);
                return Promise.resolve()
                    .then(function () {
                        return document.insertFileInFolder("root", fileLabel, myDocPath);
                    })
                    .then(function () {
                        return updater.readUpdateTable();
                    })
                    .then(function (mess) {
                        return update.getUpdates();
                    })
                    .then(function (rows) {
                        rows.should.have.length(0);
                        setTimeout(function () {
                            return service.countFromAnOtherWorld("document").then(function (body) {
                                body.count.should.equal(1);
                                done();
                            })
                        }, 1000);

                    })
                    .catch(function (err) {
                        console.log(err.message || err);
                    });
            })
        })

    })
})