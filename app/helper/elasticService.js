//Classe that consume builder to perform request to elastic serveur
var request = require("request"),
    utils = require("./utils");

//Conf parameters
var conf = require("../config");
var elasticSearchPort = conf.elastic.port,
    protocol = conf.elastic.protocol,
    serverIp = conf.elastic.serverIp,
    indexName = "opus",
    typeName = "document",
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

//var pageNum = request.params.page;
//var perPage = request.params.per_page;
var elasticService = {
    //Index document into elastic 
    // Warning old version
    //Return Promise
    createDocument: function (row) {
        var path = row.path;
        var data = {
            document_id: row.file_id,
            version_id: row.version_id,
            //TODO : name = file label not file version
            name: row.label
        }

        //TODO : get last version if exist ,remove then create


        return new Promise(function (resolve, reject) {
            
            var requestData = elasticBuilder.createDocument(path, data);
            
            if (requestData) {
                console.log(data.document_id);
                client.create({
                    id: data.document_id,
                    index: indexName,
                    type: 'document',
                    body: requestData
                }).then(function (resp) {
                    resolve("Document " + data.document_id + " version " + data.version_id + " inserted");
                }, function (err) {
                    reject(err.message || err);
                });
            } else {
                reject("no request data");
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
            // TODO : reidex only if path change  
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
                    resolve("PIN id " + row.pin_id + " inserted");
                }, function (err) {
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

    countByType: function (type) {
        return new Promise(function (resolve, reject) {
            client.count({
                index: 'opus'
            }, function (error, response) {
                resolve(response);
            });
        })

    },

    ping: function (type) {
        return client.ping({
            requestTimeout: 30000,
            // undocumented params are appended to the query string
            hello: "elasticsearch"
        });
    },

    addGroupToDocument : function(group_id,document_id){
        var options = {
            method: 'POST',
            url: baseURL + "/opus/document/_update_by_query",
            json: objectMapping
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    },

    removeGroupToDocument : function(group_id, document_id){

    },

    countFromAnOtherWorld(type) {
        //index file
        //Option for resquest
        var options = {
            method: 'GET',
            url: baseURL + "/opus/_count",
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    }
}




module.exports = elasticService;

