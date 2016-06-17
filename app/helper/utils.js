//Class for utils function
var fs = require('fs');


var utils = {
    extToType: {
        ".doc": "doc"
        , ".docx": "doc"
        , ".pdf": "pdf"
        , ".pptx": "ppt"
    },

    // function to encode file data to base64 encoded string
    base64_encode: function (file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    },

    //Give ramdon number
    randomIntInc: function (low, high) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    },

    //Format date for dateBased search
    getTodayDateFormat: function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth() + 1; //January is 0!
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }
        if (mm < 10) {
            mm = '0' + mm
        }
        //today = yyyy + '/' + mm + '/' + dd;
        today = dd + '/' + mm + '/' + yyyy;
        return today;
    },

    //Read the file name from folder and do callback for everyone of them
    readFolder: function (dirname, callback, onError) {
        fs.readdir(dirname, function (err, filenames) {
            if (err) {
                onError(err);
                return;
            }
            filenames.forEach(function (filename) {
                callback(filename);
            });
        });
    },

    //Get extension from string
    getExt: function (path) {
        var i = path.lastIndexOf('.');
        return (i < 0) ? '' : path.substr(i);
    },

    //get elastic type associate to extension 
    getType: function (path) {
        var ext = this.getExt(path);
        if (ext !== "" && this.extToType.hasOwnProperty(ext)) {
            return this.extToType[ext];
        } else return "unknown"
    },

    //allow to continue promise.all regardless of if one promise has failed.
    reflect: function (promise) {
        return promise.then(function (v) {
            return { v: v, status: "resolved" }
        },
            function (e) {
                return { e: e, status: "rejected" }
            });
    },

    //Promise catch
    onError: function (err) {
        console.log("throwing error");
        //return reject(err.message || err);
        throw new Error(err.message || err);
    }
}



module.exports = utils;