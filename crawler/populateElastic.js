//Conf parameters
elasticSearchPort = "9200",
    protocol = "http",
    indexName = "opus",
    typeName = "document",
    serverIp = "localhost",
    folderName = "indexedDocuments",
    connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';

//Module
request = require("request"),
    utils = require("./utils.js"),
    mapping = require("./mapping.js"),
    pg = require('pg'),
    pgp = require('pg-promise')(),
    db = pgp(connectionString);

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

console.log(options.url);

//Insert doccument read right into pgsql database
function insertDocumentIntoDB(filename) {
    //Add the pdf in database using client pool
    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO document(document_name,application_id) values($1, $2) RETURNING document_id;", [filename, 1], function (err, result) {
            if (!err) {
                insertedId = result.rows[0].document_id;
                readPrivilege = utils.randomIntInc(1, 3);
                client.query("INSERT INTO document_privilege(privilege_id, document_id) values($1, $2)", [readPrivilege, insertedId], function (err, result) {
                    if (!err) {
                        console.log("Insertion into database for " + filename + " : ok");
                    } else {
                        console.log(err);
                    }
                    done();
                })

            } else {
                console.log(err);
                //call `done()` to release the client back to the pool
                done();
            }
        });


    });
}

// function to index file in elastic serveur by REST API
function indexFile(filename) {
    isIndexed(filename).then(function () {
        base64file = utils.base64_encode("../" + folderName + "/" + filename);
        fileSize = Buffer.byteLength(base64file);
        //object depending on elastic mapping    
        //TODO add more metadata             
        requestData = {
            "attachment": {
                "_content": base64file,
                "_name": filename,
                "_date": utils.getTodayDateFormat(),
                "_content_length": fileSize
            },
            "document_type": utils.getType(filename)
        }
        //Add object and content lenght header
        options.json = requestData;
        options.headers["Content-Length"] = fileSize;

        //index file
        request(options, function (err, response, body) {
            if (!err) {
                if (response.statusCode === 201 || response.statusCode === 200) {
                    if (typeof body != undefined) {
                        console.log("Indexation of " + filename + " : " + body.created + " with status " + response.statusCode);
                        //Pass the filename cause of asynchronous behavior
                        insertDocumentIntoDB(filename);
                    }
                } else {
                    if (response.statusCode === 400) {
                        console.log('Bad Request');
                    }
                    console.log('Unhandled status code : ' + response.statusCode);
                }
            } else {
                if (err.code == "ECONNRESET" && fileSize > 104857600) {
                    console.log("Connexion reset : " + filename + " content length exceeded 104857600 bytes " + "(" + fileSize + ")");
                }
                else console.log(err);
            }
        });
    })
        .catch(function (err) {
            console.log("Catch in indexFile");
            console.log(err);
        })

}

//serach if document with same nae already indexed in elastic
function isIndexed(fileName) {
    return new Promise(function (resolve, reject) {
        objectRequest = {
            "fields": ["attachment.name"],
            "query": {
                "match_phrase": {
                    "attachment.name": fileName
                }
            }
        };
        //Option for resquest
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            json: objectRequest,
            url: baseURL + "/" + indexName + "/_search"
        };
        request(options, function (err, response, body) {
            if (!err && response.statusCode === 200) {
                //Parse response into JSON                       
                if (body.hits.total == 0) {
                    resolve(body);
                } else {
                    reject("File with name " + fileName + " is already indexed");
                }
            } else {
                if (response.statusCode === 400) {
                    reject('Bad Request');
                }
                if (err) {
                    reject(err);
                } else {
                    reject(body);
                }
            }
        });
    });
}

//Function that create index and associate mapping for attachement file
function createIndex() {
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
                    console.log("Success creation of index");
                } else {
                    console.log("Error in creation of mapping : did you install the mapping attachment pluggin ? Status code = " + response.statusCode);
                    console.log(body);
                }
            });
        }
        else {
            console.log("Create index error :");
            if (err) {
                console.log(err);
            } else {
                console.log(body);
            }
        }
    });
}

//Clean all index and his content
function cleanALL() {
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
            t.none("DROP TRIGGER account_change_trigger ON document"),
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
            console.log("DB clean");
        })
        .catch(function (error) {
            console.log("ERROR:", error.message || error);
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


function bulk(){
    //create json bulk file from db
    //sent in /_bulk
}

//Main
if (process.argv[2] === "clear") {
    console.log("Clean process...");
    cleanALL();
}
else if (process.argv[2] === "create") {
    console.log("Create index...");
    createIndex();
}
else {
    console.log("****** Start crawling ******")
    //OLD MAIN
    // utils.readFolder("../" + folderName, indexFile, function (err) {
    //     console.log("Error occured")
    //     console.log(err);
    // });
    //Main V2 : app handle indexing
    utils.readFolder("../" + folderName, justDocumentDB, function (err) {
        console.log("Error occured")
        console.log(err);
    });
}
