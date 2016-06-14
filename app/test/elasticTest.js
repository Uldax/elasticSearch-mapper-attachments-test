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
    log: 'trace'
});



var myDocPath = "indexedDocuments/FEC.pdf";
var myDoc2Path = "indexedDocuments/essai.docx";



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

function clean_all() {
    return Promise.resolve()
        .then(function () {
            return testModel.restart_db()
        })
        .then(function () {
            return document.insertFolder("root")
        })
        .then(function () {
            return client.indices.exists({ index: "opus" })
        })
        .then(function (exist) {
            if (exist) {
                return client.indices.delete({ index: "opus" })
            } else {
                return Promise.resolve()
            }
        })
        .then(function () {
            return createIndex()
        })
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

        it('Updater should continue even if one update failed but update stay in stage', function (done) {
            this.timeout(3000);
            return Promise.resolve()
                .then(function () {
                    return Promise.all(
                        [
                            document.insertFileInFolder("root", "fileLabel", "thispathdoesntExist.doc"),
                            document.insertFileInFolder("root", fileLabel, myDocPath)
                        ]
                    )
                })
                .then(function () {
                    return updater.readUpdateTable();
                })
                .then(function (mess) {
                    return update.getUpdates();
                })
                .then(function (rows) {
                    rows.should.have.length(1);
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

        it('Updater should remove staged error after X run')

        describe('Document update', function () {
            before(function (done) {
                // In we clean and set the trigger for the bd
                return Promise.resolve()
                    .then(function () {
                        return testModel.restart_db()
                    })
                    .then(function () {
                        return document.insertFolder("root")
                    })
                    .then(function () {
                        return client.indices.exists({ index: "opus" })
                    })
                    .then(function (exist) {
                        if (exist) {
                            return client.indices.delete({ index: "opus" })
                        } else {
                            return Promise.resolve()
                        }
                    })
                    .then(function () {
                        createIndex().then(function () {
                            done()
                        })
                    })
                    .catch(function (err) {
                        console.log(err.message || err);
                    });
            })

            it("Document insert should remove update after tracker and add field in elastic", function (done) {
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

            it("New file version should remove update after tracker and stay the same number in elastic", function (done) {
                this.timeout(4000);
                return Promise.resolve()
                    .then(function () {
                        return document.insertFileVersionByFileLabel(fileLabel, myDoc2Path);
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
                                console.log(body);
                                body.count.should.equal(1);
                                done();
                            })
                        }, 1000);
                    })
                    .catch(function (err) {
                        console.log(err.message || err);
                        done();
                    });
            })

            it("If Double update on same file just 1 update")

            it("Document update version stay the same number in elastic")

            it("Multiple update with file label change")
        })

        describe('Multi Document update', function () {

            it("Multiple Document insert should remove update after tracker and add multiple field in elastic")

            it("Multiple new file version should remove update after tracker and remove then add field in elastic")

            it("Document new version should be remove update after tracker and update field in elastic")
        })

        describe('Pinboard update', function () {
            it("Pinboard insert do nothing")
            it("Pinboard update must update all pin concerned in elastic")
            it("Pinboard unindex");
        })

        //Like document
        describe('Pin update', function () {
            it("Pin insert should remove update after tracker and add field in elastic");
            it("Pin update should remove update after tracker and keep same number in elastic");
            it("Pin unindex");
        })

        describe('Layout update', function () {
            it("Layout insert do nothing")
            it("Layout update must update all pin concerned in elastic")
            it("Layout unindex");
        })


    })
})