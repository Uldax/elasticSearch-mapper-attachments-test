"use strict";
//Script for the first user of elastic 
// Called with import parameter : npm bin/www import
//Create index/Mapping and index data from database into elastic
//Current data handle : file / version / pinboard / layout / pin
const elasticService = require('./elasticService.js'),
    documentModel = require('../models/document.js'),
    pinModel = require('../models/pin.js'),
    elasticUpdater = require('./updater/elasticUpdater.js');

const elasticImporter = {
    start: function () {
        console.log("Time to import");

        bulk()
            .then(function (message) {
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

};

function bulk() {
    //create json bulk file from db
    //sent in /_bulk
    return new Promise(function (resolve, reject) {
        pinModel.getAllPinInfo()
            .then(function (rows) {
                if (rows.length !== 0) {
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
                    Promise.all(actionPromises.map(elasticUpdater.reflect))
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