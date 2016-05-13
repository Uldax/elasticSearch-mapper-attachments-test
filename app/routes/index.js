var express = require('express');
var router = express.Router();
var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';


/* GET home page. */
router.get('/', function (req, res, next) {

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

router.get('/search', function (req, res, next) {

    res.render('index', { title: 'Express' });
});

module.exports = router;
