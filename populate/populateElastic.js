var fs = require('fs')
var request = require("request");
//ElasticSearch parameters
var elasticSearchPort = "9200";
var protocol = "http"
var indexName = "test/person"
var serverIp = "localhost";	
var baseURL = protocol+"://"+serverIp+":"+elasticSearchPort+"/"+indexName;
//Folder parameters
var folderName = "indexedDocuments";

//Option for resquest
var options = {
    method: 'POST',
    url :  baseURL+"/",
    headers : {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Transfer-Encoding':'chunked'
    }
};


var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';
var client = new pg.Client(connectionString);
client.connect();




// function to encode file data to base64 encoded string
function base64_encode(file) {    
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

function insertDocumentIntoDB(filename) {
    //Add the pdf in database
    client.query("INSERT INTO document(document_name,application_id) values($1, $2) RETURNING document_id;", [filename, 1], function (err, result) {
        console.log(result);
    });
    //var readPrivilege = randomIntInc(1,3);
    //client.query("INSERT INTO pdf_privilege(privilege_id, pdf_id) values($1, $2)", [data.text, readPrivilege]);                                 
    query.on('end', function () { client.end(); });
}
    
// function to index file in elastic serveur by REST API
function indexFile(filename) { 
    
    isIndexed(filename).then(function(){
        var base64file = base64_encode("../"+folderName+"/"+filename);
        var fileSize = Buffer.byteLength(base64file);
        
        //object depending on elastic mapping    
        //TODO add more metadata             
        var requestData = {   
            "my_attachment" : {
                "_content" : base64file,
                "_name" : filename,
            }
        }  
        //Add object and content lenght header
        options.json = requestData;
        options.headers["Content-Length"] = fileSize;

        //index file
        request(options, function(err, response, body) {
            if (!err) {
                if(response.statusCode === 201 || response.statusCode === 200 ) {    
                    if (typeof body != undefined) {
                        
                        console.log("Creation of "+filename+" : " + body.created);
                    } 
                } else {
                    if (response.statusCode === 400) {
                        console.log('Bad Request');
                    }
                    console.log( 'Unhandled status code : '+ response.statusCode);
                }         
            } else{
                if(err.code == "ECONNRESET" && fileSize > 104857600 ){
                    console.log("Connexion reset : "+filename+" content length exceeded 104857600 bytes " + "("+fileSize+")");
                }
                else console.log(err);
            }   
        });
    })   
    .catch(function(err){
        console.log(err);
    })
  
}   

function isIndexed(fileName){
    return new Promise(function(resolve, reject) {
            var objectRequest = {
                "fields": [ "my_attachment.name" ],
                "query": {
                    "match_phrase": {
                        "my_attachment.name": fileName
                    }
                }
            };
            //Option for resquest
            var options = {
                method: 'POST',
                headers : {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                json: objectRequest,
                url : baseURL+"/_search"
            };         
            request(options, function(err, response, body) {
                if (!err && response.statusCode === 200) {
                    //Parse response into JSON                       
                    if (body.hits.total == 0) {
                        resolve(body);
                    } else {                
                        reject("File with name "+fileName+" is already indexed");
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
function readFolder(dirname,onError) {
  fs.readdir(dirname, function(err, filenames) {
    if (err) {
      onError(err);
      return;
    }
    filenames.forEach(function(filename) {
      indexFile(filename)
    });
  });
}
 


//Main
readFolder("../"+folderName, function(err){
    console.log("Error occured")
    console.log(err);
});