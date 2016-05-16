var express = require('express');
var request = require("request");
var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';
var elasticSearchPort = "9200";
var protocol = "http"
var indexName = "test/person"
var serverIp = "localhost";
var baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort;

/* GET home page. */
router.get('/', function (req, res, next) {
    console.log('call to home');
    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT * FROM public.group", function (err, result) {
            if (!err) {
                done();
                res.render('index', { roles: result.rows });
            } else {
                console.log(err);
                //call `done()` to release the client back to the pool
                done();
            }
        });
    });

});

//Ajax endpoint for elastic search
router.get('/search', function (req, res, next) {
    var requestString = req.query.search || "";
    var requestDone = false;
    var dbDone = false;
    var filterCall = false;
    var userAuth = req.query.userAuth || 0;
    if (userAuth === 0) {
        res.send("No user Auth given");
    }
    var userDocuments = {};
    var elasticBody = {};

    console.log(requestString + " with authLevel " + userAuth);

    var objectRequest = {
        "query": {
            "match": {
                "my_attachment.content": requestString
            }
        },
        "highlight": {
            "fields": {
                "my_attachment.content": {
                }
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


    //get read access for user
    pg.connect(connectionString, function (err, client, done) {
        if (err) {
            return console.error('error fetching client from pool', err);
        }
        client.query("SELECT document_name FROM public.document_privilege INNER JOIN document ON document_privilege.document_id = document.document_id WHERE privilege_id = $1 ", [userAuth], function (err, result) {
            if (!err) {
                done();
                userDocuments = result.rows;
                console.log(userDocuments);
                dbDone = true;
                if (requestDone && !filterCall) {
                    filterOutput();
                }
            } else {
                console.log("error");
                console.log(err);
                //call `done()` to release the client back to the pool       

            }
            done();
        });
    });

    request(options, function (err, response, body) {
        console.log("request send");
        console.log(response.statusCode);
        if (!err && response.statusCode === 200) {
            if (body.hits.total != 0) {
                elasticBody = body;
                //hits.hits.node._source.my_attchement._name
                requestDone = true;
                if (dbDone && !filterCall) {
                    filterOutput();
                }
            } else {
                res.send({
                    error: "No resultat found",
                    code: 1
                });
            }
        } else {
            if (!err) {
                res.send({
                    error: "request status : " + response.statusCode,
                    code: 2
                });

            } else {
                res.send(err);
            }
        }
    });

    function filterOutput() {
        filterCall = true;
        var filterResult = [];
        for (node in elasticBody.hits.hits) {
            var name = elasticBody.hits.hits[node]._source.my_attachment._name;
            if (in_array(userDocuments, name)) {
                filterResult.push(elasticBody.hits.hits[node]);
            }
        }
        console.log('call to filter')
        if (filterResult.length > 0) {
            res.send(filterResult);
        } else {
            res.send({
                error: "No resultat found",
                code: 1
            });
        }
    }

});

function in_array(array, document_name) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].document_name === document_name) {
            return true;
        }

    }
    return false;
}


module.exports = router;
