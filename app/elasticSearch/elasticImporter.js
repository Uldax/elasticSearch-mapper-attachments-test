"use strict";
//Script for the first user of elastic 
// Called with import parameter : npm bin/www import
//Create index/Mapping and index data from database into elastic
//Current data handle : file / version / pinboard / layout / pin
const elasticService = require('./elasticService.js'),
    documentModel = require('../models/document.js'),
    pinModel = require('../models/pin.js'),
    elasticUpdater = require('./updater/elasticUpdater.js'),
    indexBuilder = require('./builder/indexBuilder.js'),
    utils = require('../helper/utils.js')

const elasticImporter = {
    state: [],

    start: function () {
        console.log("Time to import");

        let promiseImport = [importPins(), importFiles()];

        Promise.all(promiseImport)
        .then(function(result) {
            console.log(result);
        })
        .catch(function(error) {
            console.log(error.message || error);
        });
        

        // importPins()
        //     .then(function (message) {
        //         console.log(message);
        //     })
        //     .catch(function (error) {
        //         console.log(error.message || error);
        //     });

        // importFiles()
        //     .then(function (message) {
        //         console.log(message);
        //     })
        //     .catch(function (error) {
        //         console.log(error.message || error);
        //     });
    },

};

function importPins() {
    //create json bulk file from db
    //sent in /_bulk
    return pinModel.getPinInfoWithGroup()
        .then(function (rows) {
            if (rows.length !== 0) {
                console.log("Call to service");
                return (elasticService.createPinBulk(rows));
            }
            else {
                return Promise.reject("No pins in DB");
            }
        })
        .then(function () {
            return Promise.resolve("Pins imported");
        })
        .catch(function (error) {
            return Promise.reject(error.message || error);
        });
}



function importFiles() {
    return new Promise(function (resolve, reject) {
        let filesToImport = [];
        documentModel.getFilesInfo()
            .then(function (rows) {
                console.log(rows);
                for (let row in rows) {
                    if (rows.hasOwnProperty(row)) {
                        let element = rows[row];
                        filesToImport.push(function () {
                            return reflect(importFile(element));
                        });
                    }
                }
                //console.log(filesToImport.length);
                return pseries(filesToImport);
            })
            .then(function () {
                //TODO handle error
                var rejectResult = elasticImporter.state.filter(x => x.status === "rejected");
                var updateLength = elasticImporter.state.length;
                console.log("Update todo :" + updateLength);
                console.log("Numbers of failed :" + rejectResult.length);
                rejectResult.forEach(function (element) {
                    console.log(element.e);
                }, this);
                resolve("File imported");
            })
            .catch(function (error) {
                reject(error.message || error);
            });

    });
}

function importFile(row) {
    return new Promise(function (resolve, reject) {
        Promise.resolve()
            .then(function () {
                //TODO SQL resquest
                return documentModel.getGroupForFile(row.file_id);
            })
            .then(function (rowGroups) {

                console.log(rowGroups);
                return elasticService.createDocument(row, rowGroups.array);
            })
            .then(function () {
                resolve("File with id " + row.file_id + " indexed");
            })
            .catch(function (err) {
                reject(err.message || err);
            });
    });
}

function pseries(list) {
    var p = Promise.resolve();
    var intialSize = list.length;
    //La méthode reduce() applique une fonction qui est un « accumulateur »
    // traite chaque valeur d'une liste (de la gauche vers la droite)
    // afin de la réduire à une seule valeur.
    return list.reduce(function (pacc, fn) {
        return pacc = pacc.then(function (res) {
            if (res) {
                //Store the result of every action
                elasticImporter.state.push(res);
                console.log(elasticImporter.state.length + " of " + intialSize);
            }
            return fn();
        });
    }, p);

}

function reflect(promise) {
    if (utils.isFunction(promise)) {
        return promise().then(function (v) { return { v: v, status: "resolved" }; },
            function (e) { return { e: (e.message || e), status: "rejected" }; });
    } else {
        return promise.then(function (v) { return { v: v, status: "resolved" }; },
            function (e) { return { e: (e.message || e), status: "rejected" }; });
    }

}



module.exports = elasticImporter;