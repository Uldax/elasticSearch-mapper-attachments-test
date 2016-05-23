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
    folderName = "indexedDocuments",
    elasticBuilder = require("./elasticBuilder");


var elasticsearch = require('elasticsearch');
var ejs = require('./elastic');
var client = new elasticsearch.Client({
    host: serverIp + ":" + elasticSearchPort,
    log: 'trace'
});



//var pageNum = request.params.page;
//var perPage = request.params.per_page;

client.ping({
    requestTimeout: 30000,
    // undocumented params are appended to the query string
    hello: "elasticsearch"
}, function (error) {
    if (error) {
        console.error('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});

var elasticService = {
    //Index document into elastic 
    // Warning old version
    //Return Promise
    createDocument: function (row) {
        var fileName = row.document_name;
        return new Promise(function (resolve, reject) {
            var requestData = elasticBuilder.createDocument(fileName);
            var versionID = row.update_id;
            client.create({
                index: indexName,
                type: 'document',
                id: versionID,
                body: requestData
            }).then(function (resp) {
                resolve("Document with " + versionID + " insert");
            }, function (err) {
                reject(err.message);
            });
            //! fileSize > 104857600      
        });
    },


    updateDocument: function (row) {
        //Get info from db 
        // format body
        var versionID = row.update_id;
        var options = Object.assign({}, baseOptions);
        client.update({
            index: indexName,
            type: 'document',
            id: versionID,
            body: {
                // put the partial document under the `doc` key
                doc: {
                    title: 'Updated'
                }
            }
        }).then(function (resp) {
            console.trace("Document with " + versionID + " delete");
        }, function (err) {
            console.trace(err.message);
        });

    },

    //With api
    deleteDocument: function (row) {
        var versionID = row.update_id;
        var options = Object.assign({}, baseOptions);
        client.delete({
            index: indexName,
            type: 'document',
            id: versionID
        }).then(function (resp) {
            console.trace("Document with " + versionID + " delete");
        }, function (err) {
            console.trace(err.message);
        });
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

