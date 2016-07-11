"use strict";
var express = require('express');
var request = require("request");
var elasticService = require("./../elasticSearch/elasticService");
var user = require("./../models/user");
var router = express.Router();


var SearchBuilder =  require("./../elasticSearch/builder/searchBuilder");

/* GET home page. */
router.get('/', function (req, res, next) {
    // pg.connect(connectionString, function (err, client, done) {
    //     if (err) {
    //         return console.error('error fetching client from pool', err);
    //     }
    //     client.query("SELECT * FROM public.group", function (err, result) {
    //         if (!err) {
    //             done();
    //             res.render('index', { roles: result.rows });
    //         } else {
    //             console.log(err);
    //             //call `done()` to release the client back to the pool
    //             done();
    //         }
    //     });
    // });
    res.render('index', { roles: [] });

});

//Ajax endpoint for elastic search
router.post('/search', function (req, res, next) {
    console.log(req.body);
    var querryString = req.body.requestString || "";
    var requestDone = false;
    var dbDone = false;
    var filterCall = false;
    var userAuth = req.body.userAuth || 0;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // if (userAuth === 0 || querryString === "") {
    //     res.send({
    //         error: "Missing base parameters"
    //     });
    //     return;
    // }
    console.log(querryString + " with authLevel " + userAuth);
    elasticService.searchTest()
        .then(function (result) {
            res.send(result);
            //get read access for user
            // pg.connect(connectionString, function (err, client, done) {
            //     if (err) {
            //         return console.error('error fetching client from pool', err);
            //     }
            //     client.query("SELECT document_name FROM public.document_privilege INNER JOIN document ON document_privilege.document_id = document.document_id WHERE privilege_id = $1 ", [userAuth], function (err, result) {
            //         if (!err) {
            //             done();
            //             userDocuments = result.rows;
            //             //console.log(userDocuments);
            //             dbDone = true;
            //             if (!filterCall) {
            //                 filterOutput();
            //             }
            //         } else {
            //             console.log("error");
            //             console.log(err);
            //             //call `done()` to release the client back to the pool       

            //         }
            //         done();
            //     });
            // });
        }).catch(function (err) {
            res.send(err.message || err);
        });
});

router.post('/searchTest', function (req, res, next) {

    var querryString = req.body.requestString || "";
    var userId = req.body.userAuth || 0;
    if (userId === 0 || querryString === "") {
        res.send({
            error: "Missing base parameters"
        });
        return;
    }
    //Get group from user
    user.getGroupsForUser(userId)
        .then(function (row) {
            const resultSize = 8;
            const sb = new SearchBuilder(req.body,row.array,userId,resultSize);
            return elasticService.search(sb.search);       
        })
        .then(function(results){
             res.send(results);
        })
        .catch(function (err) {
            res.send(err.message || err);
        });
});


module.exports = router;
