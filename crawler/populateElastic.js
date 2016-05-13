var fs = require('fs')
var request = require("request");
//ElasticSearch parameters
var elasticSearchPort = "9200";
var protocol = "http"
var indexName = "test/person"
var serverIp = "localhost";
var baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort;
//Folder parameters
var folderName = "indexedDocuments";

//Option for resquest
var options = {
    method: 'POST',
    url: baseURL + "/" + indexName + "/",
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Transfer-Encoding': 'chunked'
    }
};


var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';


// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

//Give ramdon number
function randomIntInc(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

//Insert doccument read right into pgsql database
function insertDocumentIntoDB(filename) {
    //Add the pdf in database using client pool
    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("INSERT INTO document(document_name,application_id) values($1, $2) RETURNING document_id;", [filename, 1], function (err, result) {
            if (!err) {
                var insertedId = result.rows[0].document_id;
                var readPrivilege = randomIntInc(1, 3);
                client.query("INSERT INTO document_privilege(privilege_id, document_id) values($1, $2)", [readPrivilege, insertedId], function (err, result) {
                    if (!err) {
                        console.log("Insertion into database for " + filename + " : ok");
                    } else{
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
        var base64file = base64_encode("../" + folderName + "/" + filename);
        var fileSize = Buffer.byteLength(base64file);

        //object depending on elastic mapping    
        //TODO add more metadata             
        var requestData = {
            "my_attachment": {
                "_content": base64file,
                "_name": filename,
            }
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
            console.log(err);
        })

}

//serach if document with same nae already indexed in elastic
function isIndexed(fileName) {
    return new Promise(function (resolve, reject) {
        var objectRequest = {
            "fields": ["my_attachment.name"],
            "query": {
                "match_phrase": {
                    "my_attachment.name": fileName
                }
            }
        };
        //Option for resquest
        var options = {
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
                reject(err);
            }
        });
    });
}

//Read the file name from folder and index them
function readFolder(dirname, onError) {
    fs.readdir(dirname, function (err, filenames) {
        if (err) {
            onError(err);
            return;
        }
        filenames.forEach(function (filename) {
            indexFile(filename);
        });
    });
}

//Function that create index and associate mapping for attachement file
function createIndex() {
    //Create the index
    var options = {
        method: 'PUT',
        url: baseURL + "/test"
    };
    request(options, function (err, response, body) {
        if (!err && response.statusCode === 200) {
            //Create the mapping
            var objectMapping = {
                "person": {
                    "properties": {
                        "my_attachment": { "type": "attachment" }
                    }
                }
            }
            options = {
                method: 'PUT',
                url: baseURL + "/test/person/_mapping",
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                json: objectMapping,
            };
            request(options, function (err, response, body) {
                if (!err && response.statusCode === 200) {
                    console.log("Success creation of index");
                } else console.log(err);
            });
        }
        else {
            console.log("Create index error");
            console.log(err);
        }
    });
}

//Clean all index and his content
function cleanALL() {
    //Option for resquest
    var options = {
        method: 'DELETE',
        url: baseURL + "/test"
    };

    request(options, function (err, response, body) {
        if (!err && response.statusCode === 200) {
            createIndex();
        } else {
            console.log(err);
        }
    });

    pg.connect(connectionString, function (err, client, done) {
        client.query("DELETE FROM document_privilege", function (err, result) {
            if (!err) {
                console.log("Table Document_privilege delete ");
            } else {
                console.log(err);
            }
        });

         client.query("DELETE FROM document", function (err, result) {
            console.log(done());
            done();
            if (!err) {
                console.log("Table Document delete ");
            } else {
                console.log(err);
            }
          
        });
    });


}


//Main
if (process.argv[2] === "clear") {
    console.log("Clean process...");
    cleanALL();
} else {
    console.log("****** Start crawling ******")
    readFolder("../" + folderName, function (err) {
        console.log("Error occured")
        console.log(err);
    });
}
