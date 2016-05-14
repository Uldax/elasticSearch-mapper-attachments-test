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
    console.log(requestString);
    var objectRequest = {
        "query": {
            "query_string": {
                "query": requestString
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
            if (body.hits.total != 0) {
                res.send(body);
            } else {
                res.send(err)
            }
        } else {
           res.send("No resultat found");
        }
    });
});

module.exports = router;
