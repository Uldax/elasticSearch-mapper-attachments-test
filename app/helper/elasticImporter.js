//Conf parameters
elasticSearchPort = "9200",
    protocol = "http",
    indexName = "opus",
    typeName = "document",
    serverIp = "localhost",
    folderName = "indexedDocuments",
    connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';

//Module
request = require("request"),
    utils = require("./utils.js"),
    // mapping = require("./mapping.js"),
    pg = require('pg'),
    pgp = require('pg-promise')(),
    db = pgp(connectionString);
elasticService = require('./elasticService.js')

//ShortCut
elasticPath = indexName + "/" + typeName,
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort;

//Option for resquest
options = {
    method: 'POST',
    url: baseURL + "/" + elasticPath + "/",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Transfer-Encoding': 'chunked'
    }
};

var documentModel = require('../models/document.js');
var pinModel = require('../models/pin.js');
var utils = require('./utils.js')

var elasticImporter = {

    start: function () {
        console.log("Time to import");
        bulk().then(function (message) {
            console.log(message);
        })
            .catch(function (error) {
                console.log(error.message || error);
            });
        importFiles()
            .then(function (message) {
                console.log(message);
            })
            .catch(function (error) {
                console.log(error.message || error);
            });
    },

}

//TODO add createIndex

function bulk() {
    //create json bulk file from db
    //sent in /_bulk
    return new Promise(function (resolve, reject) {
        pinModel.getAllPinInfo()
            .then(function (rows) {
                if (rows.length != 0) {
                    console.log("Call to service");
                    elasticService.bulkPin(rows).then(function (message) {
                        resolve(message);
                    })
                        .catch(function (error) {
                            console.log(error);
                            reject(error.message || error);

                        });

                }
                else {
                    reject("No pins in DB");
                }
            })
            .catch(function (error) {
                reject(error.message || error);
            })
    })
}

function importFiles() {
    return new Promise(function (resolve, reject) {
        documentModel.getFilesInfo()
            .then(function (rows) {
                var actionPromises = [];
                if (rows.length != 0) {
                    for (var row = 0; row < rows.length; row++) {
                        actionPromises.push(elasticService.createDocument(rows[row]));
                    }
                    Promise.all(actionPromises.map(utils.reflect))
                        .then(function (results) {
                            console.log(results);
                            var rejectResult = results.filter(x => x.status === "rejected");
                            elasticUpdater.curentUpdate = false;
                            //TODO handle rejected
                            resolve(rejectResult);
                        })
                        .catch(function (err) {
                            elasticUpdater.curentUpdate = false;
                            reject(err.message || err);
                        })
                }
                else {
                    reject("No files in DB");
                }
            })
            .catch(function (error) {
                reject(error.message || error);
            })
    })
}

module.exports = elasticImporter;