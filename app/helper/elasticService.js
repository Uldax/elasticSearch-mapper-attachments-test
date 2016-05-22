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

//General option for resquest

var baseOptions = {
    method: 'POST',
    url: baseURL + "/" + elasticPath + "/",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Transfer-Encoding': 'chunked'
    }
};

var elasticService = {
    //Index document into elastic 
    //Return Promise
    createDocument: function (row) {
        var fileName = row.document_name;
        return new Promise(function (resolve, reject) {
            var base64file = utils.base64_encode("../" + folderName + "/" + fileName);
            var fileSize = Buffer.byteLength(base64file);
            var requestData = elasticBuilder.createDocument(fileName, base64file);
            //Copy base option
            var options = baseOptions;
            options.json = requestData;
            //here ad version id
            var versionID = row.update_id;
            options.url += versionID;
            var fileSize = Buffer.byteLength(base64file);
            options.headers["Content-Length"] = fileSize;

            //index file
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 201 || response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve("Indexation of " + fileName + " :" + body.created + " Status " + response.statusCode);
                        }
                    } else {
                        reject('Error with status code : ' + response.statusCode);
                    }
                } else {
                    if (err.code == "ECONNRESET" && fileSize > 104857600) {
                        reject("Connexion reset : " + fileName + " content length exceeded 104857600 bytes " + "(" + fileSize + ")");
                    }
                    else reject(body);
                }
            });
        });
    },

    updateDocument: function (row) {

    },


    deleteDocument: function (row) {

    },


    search: function (buildOption) {
        return new Promise(function (resolve, reject) {
            //Get the json from builder
            var objectRequest = elasticBuilder.get(buildOption);
            console.log(objectRequest);
            //Option for resquest
            var options = baseOptions;
            options.json = objectRequest;
            options.url = baseURL + "/" + indexName + "/_search";
            //GetDocument readable here
            //then request
            elasticService.sendRequest(options)
                .then(function (result) {
                    console.log("result return");
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        })

    },

    sendRequest: function (options) {
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                //Check for request error
                if (!err) {
                    //Check for elastic error
                    if (body.hasOwnProperty("error")) {
                        reject({
                            error: body.error,
                            code: 3
                        });
                    } else {
                        resolve(body)
                    }
                } else {
                    reject({
                        error: err,
                        message: "Request status : " + response.statusCode,
                        code: 2
                    });
                }
            });

        });

    }
}




module.exports = elasticService;

