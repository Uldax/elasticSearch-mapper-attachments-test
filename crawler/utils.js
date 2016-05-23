var fs = require('fs');


var utils = {
    
     extToType : {
        ".doc"      : "doc"
        , ".docx"   : "doc"
        , ".pdf"    : "pdf"
        , ".pptx"   : "ppt"
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
        today = yyyy + '/' + mm + '/' + dd;
        //today = dd + '/' + mm + '/' + yyyy;
        return today;
    },

    //Read the file name from folder and index them
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
    
    getExt: function (path) {
        var i = path.lastIndexOf('.');
        return (i < 0) ? '' : path.substr(i);
    },
    
    getType : function(path){
        var ext = this.getExt(path);
        if( ext !== "" && this.extToType.hasOwnProperty(ext)){
            return this.extToType[ext];
        } else return "unknown"
    }
}



module.exports = utils;