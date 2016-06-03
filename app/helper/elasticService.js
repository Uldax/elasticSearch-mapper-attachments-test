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
        console.log(row)
        var path = row.path;

        var data = {
            document_id: row.file_id,
            version_id: row.version_id,
            name: row.label
        }
        console.log(data);


        return new Promise(function (resolve, reject) {
            var requestData = elasticBuilder.createDocument(path, data);
            if (requestData) {
                client.create({
                    index: indexName,
                    type: 'document',
                    body: requestData,
                    _id: data.document_id
                }).then(function (resp) {
                    resolve("Document " + data.document_id + " version " + data.version_id + " inserted");
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

    bulkPin: function (rows) {

        return new Promise(function (resolve, reject) {
            var body_json = elasticBuilder.bulkPin(rows);
            if (body_json) {
                client.bulk({
                    body: body_json
                }).then(function (resp) {
                    resolve("All pinboards indexed");
                }, function (err) {
                    reject(err.message || err);
                });
            }
            else {
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

    createPin: function (row) {
        return new Promise(function (resolve, reject) {
            var requestData = elasticBuilder.createPin(row);
            if (requestData) {
                client.create({
                    index: indexName,
                    type: 'pin',
                    id: row.pin_id,
                    body: requestData
                }).then(function (resp) {
                    console.log('ok send');
                    resolve("PIN id " + row.pin_id + " inserted");
                }, function (err) {
                    console.log('nop send');
                    reject(err.message || err);
                });
            } else {
                reject("error in requestData");
            }
        });
    },

    //Todo
    createPinBoard: function (row) {
        
    },


    deletePinBoard: function (id) {

    },

    updatePinBoard: function (id) {

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

