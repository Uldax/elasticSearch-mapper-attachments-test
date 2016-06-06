
var conf = require("../config");
var mapping = require("../elasticMapping");

var elasticSearchPort = conf.elastic.port,
    protocol = conf.elastic.protocol,
    serverIp = conf.elastic.serverIp,
    indexName = "opus",
    typeName = "document",
    folderName = "indexedDocuments",
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort;
elasticPath = indexName + "/" + typeName;


var options = {
    method: 'POST',
    url: baseURL + "/" + elasticPath + "/",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Transfer-Encoding': 'chunked'
    }
};
var service = require('../helper/elasticService');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: serverIp + ":" + elasticSearchPort,
    log: 'error'
});


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
        this.timeout(30000);
        client.ping({
            requestTimeout: 30000,
            // undocumented params are appended to the query string
            hello: "elasticsearch"
        }, function (error) {
            if (error) {
                throw new Error('elasticsearch cluster is down!');
            } else {
                done();
            }
        });
    });

})