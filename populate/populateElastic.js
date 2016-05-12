var fs = require('fs')
var request = require("request");
//ElasticSearch parameters
var elasticSearchPort = "9200";
var protocol = "http"
var indexName = "test/person"
var serverIp = "localhost";	

//Folder parameters
var folderName = "indexedDocuments";
var baseURL = protocol+"://"+serverIp+":"+elasticSearchPort+"/"+indexName;

//Todo get the number of total files already indexed first
var nbr=10;

//Option for resquest
var options = {
    method: 'POST',
    headers : {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
};


// function to encode file data to base64 encoded string
function base64_encode(file) {    
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}
    
// function to index file in elastic serveur by REST API
function indexFile(filename,index) { 
    
    isIndexed(filename).then(function(){
        var base64file = base64_encode("../"+folderName+"/"+filename);
        console.log("File "+filename+" loaded") ; 

        //object depending on elastic mapping    
        //TODO add more metadata             
        var requestData = {   
            "my_attachment" : {
                "_content" : base64file,
                "_name" : filename,
            }
        }  
        options.json = requestData;
        options.url =  baseURL+"/"+ index;

        console.log("Request send to " + options.url) ;   
        //index file
        request(options, function(err, response, body) {
            if (!err) {
                if(response.statusCode === 200) {    
                    if (typeof body != undefined) {
                        console.log("Creation of "+filename+" state : " + body.created);
                    } 
                } else {
                    if (response.statusCode === 400) {
                        console.log('Bad Request');
                    }
                    console.log(response.statusCode);
                }         
            } else{
                console.log(err);
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
                        reject("File "+fileName+" already indexed , change the name");
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
    filenames.forEach(function(filename,index) {
      indexFile(filename,index)
    });
  });
}
 

 
readFolder("../"+folderName, function(err){
    console.log("Error occured")
    console.log(err);
});