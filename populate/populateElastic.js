var fs = require('fs')
var request = require("request");
//ElasticSearch parameters
var elasticSearchPort = "9200";
var protocol = "http"
var indexName = "trying-out-mapper-attachments/person"
var serverIp = "localhost";	

//Folder parameters
var folderName = "indexedDocuments";
var baseURL = protocol+"://"+serverIp+":"+elasticSearchPort+"/"+indexName;
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
    var base64file = base64_encode("../"+folderName+"/"+filename);
    console.log("File loaded") ; 
    
    //object depending on elastic mapping                 
    var requestData = {   
        "cv" : base64file
    }  
    options.json = requestData;
    options.url =  baseURL+"/"+ index;
    
    console.log("Request send to") ;   
    console.log(options.url); 
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
            console.log(err.message);
        }   
    });
    console.log('request end');
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