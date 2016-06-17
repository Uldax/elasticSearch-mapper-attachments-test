// Dependencies
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('nodemon', function (cb) {

    var started = false;

    return nodemon({
        script: './bin/www'
    }).on('start', function () {
        // to avoid nodemon being started multiple times
        // thanks @matthisk
        if (!started) {
            cb();
            started = true;
        }
    })
    .on('restart', function () {
        setTimeout(function () {
            reload({ stream: false });
        }, 1000);
    });
});

gulp.task('importer', function (cb) {

    var started = false;

    return nodemon({
        script: './bin/www import'
    }).on('start', function () {
        // to avoid nodemon being started multiple times
        // thanks @matthisk
        if (!started) {
            cb();
            started = true;
        }
    })
    .on('restart', function () {
        setTimeout(function () {
            reload({ stream: false });
        }, 1000);
    });
});

gulp.task('browser-sync', ['nodemon'], function () {
    browserSync.init(null, {
        proxy: "http://localhost:3000", // local node app address
        files: ["public/**/*.*", "views/*.jade"],
        browser: "google chrome",
        port: 7000,
    });
});

gulp.task('default', ['nodemon'], function () {
    //open("http://localhost:3000", "chrome");
});

