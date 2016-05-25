//Classe that consume builder to perform request to elastic serveur
var request = require("request"),
    utils = require("./utils");

//Conf parameters
var elasticSearchPort = "9200",
    protocol = "http",
    indexName = "opus",
    typeName = "document",
    serverIp = "localhost",
    folderName = "indexedDocuments";

//ShortCut
var elasticPath = indexName + "/" + typeName,
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort,
    elasticBuilder = require("./elasticBuilder");


var elasticsearch = require('elasticsearch');
var ejs = require('./elastic');
var client = new elasticsearch.Client({
    host: serverIp + ":" + elasticSearchPort,
    log: 'error'
});

//Test elastic serveur
client.ping({
    requestTimeout: 30000,
    // undocumented params are appended to the query string
    hello: "elasticsearch"
}, function (error) {
    if (error) {
        throw new Error('elasticsearch cluster is down!');
    } else {
        console.log('Elastic serveur : all is well');
    }
});

//var pageNum = request.params.page;
//var perPage = request.params.per_page;
var elasticService = {
    //Index document into elastic 
    // Warning old version
    //Return Promise
    createDocument: function (row) {
        var fileName = row.document_name;
        var versionID = row.document_id;
        return new Promise(function (resolve, reject) {
            var requestData = elasticBuilder.createDocument(fileName);
            if (requestData) {
                client.create({
                    index: indexName,
                    type: 'document',
                    id: versionID,
                    body: requestData
                }).then(function (resp) {
                    resolve("Document version " + versionID + " inserted");
                }, function (err) {
                    reject(err.message || err);
                });
            } else {
                reject()
            }

            //! fileSize > 104857600      
        });
    },


    updateDocument: function (row) {
        //Get info from db 
        // format body
        var versionID = row.document_id;
        var fileName = row.document_name;
        return new Promise(function (resolve, reject) {
            //ReindexDocument           
            var requestData = elasticBuilder.createDocument(fileName);
            if (requestData) {
                client.update({
                    index: indexName,
                    type: 'document',
                    id: versionID,
                    body: requestData
                }).then(function (resp) {
                    resolve("Document with " + versionID + " updated");
                }, function (err) {
                    reject(err.message || err);
                });
            } else {
                reject();
            }
        })



    },

    //With api
    deleteDocument: function (versionID) {
        return new Promise(function (resolve, reject) {
            client.delete({
                index: indexName,
                type: 'document',
                id: versionID
            }).then(function (resp) {
                resolve("Document with " + versionID + " delete");
            }, function (err) {
                reject(err.message || err);
            });
        })
    },


    search: function (buildOption) {
        //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get
        return new Promise(function (resolve, reject) {
            var objectRequest = elasticBuilder.search(buildOption);
            client.search({
                index: indexName,
                body: objectRequest
            }).then(function (resp) {
                resolve(resp);
            }, function (err) {
                reject(err);
            });
        });
    },
}




module.exports = elasticService;

