"use strict";
var express = require('express');
var request = require("request");
var elasticService = require("./../elasticSearch/elasticService");
var user = require("./../models/user");
var router = express.Router();


var SearchBuilder =  require("./../elasticSearch/builder/searchBuilder");
var SuggestBuilder =  require("./../elasticSearch/builder/suggestBuilder");
const resultSize = 8;
const seab = new SearchBuilder(resultSize);
const suggb = new SuggestBuilder(resultSize);

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

router.post('/search', function (req, res, next) {
    var querryString = req.body.requestString || "";
    var userId = req.body.userId || 0;
    if (userId === 0 || querryString === "") {
        res.send({
            error: "Missing base parameters"
        });
        return;
    }
    //Get group from user
    user.getGroupsForUser(userId)
        .then(function (row) {
            var searchQuerry = sb.buildSearch(req.body,row.array,userId);
            console.log(searchQuerry);
            return elasticService.search(searchQuerry);       
        })
        .then(function(results){
             res.send(results);
        })
        .catch(function (err) {
            res.send(err.message || err);
        });
});


router.post('/suggest', function (req, res, next) {
    var querryString = req.body.requestString || "";
    var userId = req.body.userId || 0;
    if (userId === 0 || querryString === "") {
        res.send({
            error: "Missing base parameters"
        });
        return;
    }
    //Get group from user
    user.getGroupsForUser(userId)
        .then(function (row) {
            var suggestQuerry = suggb.buildSuggest(req.body,row.array,userId);
            console.log(suggestQuerry);
            return elasticService.search(suggestQuerry);       
        })
        .then(function(results){
             res.send(results);
        })
        .catch(function (err) {
            res.send(err.message || err);
        });
});

module.exports = router;
