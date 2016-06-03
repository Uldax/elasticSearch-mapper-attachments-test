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

var elasticImporter = {

    start: function () {
        console.log("Time to import");
        //Remove notify for scheduleur
        bulk().then(function (message) {
            console.log(message);
        })
        .catch(function (error){
            console.log(error.message || error);
        });
        //setInterval(readUpdate, 10000);
    },

}

//Function that create index and associate mapping for attachement file
function createIndex() {

    return new Promise(function (resolve, reject) {
        //Create the index
        options = {
            method: 'PUT',
            url: baseURL + "/" + indexName
        };
        request(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                //Create the mapping
                objectMapping = mapping.fileMapping;
                options = {
                    method: 'PUT',
                    url: baseURL + "/" + elasticPath + "/_mapping",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    json: objectMapping,
                };
                request(options, function (err, response, body) {
                    if (!err && response.statusCode === 200) {
                        resolve("Success creation of index");
                    } else {
                        console.log("Error in creation of mapping : did you install the mapping attachment pluggin ? Status code = " + response.statusCode);
                        reject(body);
                    }
                });
            }
            else {
                console.log("Create index error :");
                if (err) {
                    reject(err);
                } else {
                    reject(body);
                }
            }
        });
    });

}

//Clean all index and his content
function cleanALL() {
    return new Promise(function (resolve, reject) {
        //Option for resquest
        options = {
            method: 'DELETE',
            url: baseURL + "/" + indexName
        };

        request(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                console.log("index delete with success");
            } else {
                console.log("Error in delete index");
                console.log(body);
            }
        });


        db.tx(function (t) {
            // this = t = transaction protocol context;
            // this.ctx = transaction config + state context;
            return t.batch([
                t.none("DELETE FROM document_privilege"),
                t.none("DROP TRIGGER IF EXISTS account_change_trigger ON document"),
                t.none("DELETE FROM public.update"),
                t.none("DELETE FROM document"),
                t.none("CREATE TRIGGER account_change_trigger " +
                    "AFTER INSERT OR UPDATE OR DELETE " +
                    "ON document " +
                    "FOR EACH ROW " +
                    "EXECUTE PROCEDURE on_account_change()")
            ]);
        })
            .then(function (data) {
                resolve("DB clean");
            })
            .catch(function (error) {
                reject("ERROR:", error.message || error);
            });

    });

}

function cleanDB() {
    return new Promise(function (resolve, reject) {
        db.tx(function (t) {
            // this = t = transaction protocol context;
            // this.ctx = transaction config + state context;
            return t.batch([
                t.none("DELETE FROM document_privilege"),
                t.none("DELETE FROM document"),
            ]);
        })
            .then(function (data) {
                resolve("DB clean");
            })
            .catch(function (error) {
                console.log(error);

                reject("ERROR in clear:", error.message || error);
            });
    });

}

function justDocumentDB(filename) {
    //Add the pdf in database using client pool
    //Tasks are to simplify the use of Shared Connections when executing a chain of queries
    db.task(function (t) {
        // this = t = task protocol context;
        // this.ctx = task config + state context;
        return t.one("INSERT INTO document(document_name,application_id) values($1, $2) RETURNING document_id;", [filename, 1])
            .then(function (doc) {
                readPrivilege = utils.randomIntInc(1, 3);
                return t.none("INSERT INTO document_privilege(privilege_id, document_id) values($1, $2)", [readPrivilege, doc.document_id]);
            });
    })
        .then(function (events) {
            console.log("Document " + filename + " inserted in DB");
        })
        .catch(function (error) {
            console.log("ERROR:", error.message || error);
        });

}

function crawl() {
    utils.readFolder("../" + folderName, justDocumentDB, function (err) {
        console.log("Error occured")
        console.log(err);
    });
}

function bulk() {
    //create json bulk file from db
    //sent in /_bulk
    return new Promise(function (resolve, reject) {
        db.any("SELECT pinboard.pin.pin_id, pinboard.layout.label AS label_layout, pinboard.pinboard.label AS label_Pinboard, " +
        "pinboard.pin.label AS label_pin, pinboard.vote_pin.vote " +
        "FROM pinboard.layout " +
	    "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
	    "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
	    "INNER JOIN pinboard.vote_pin ON pinboard.pin.pin_id = pinboard.vote_pin.pin_id;")
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
                    console.log("No pins in DB");
                }
            })
            .catch(function (error) {
                reject(error.message || error);            
            })
    })
}

module.exports = elasticImporter;