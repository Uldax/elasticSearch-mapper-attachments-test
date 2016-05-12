var fs = require('fs')
var request = require("request");
var elasticSearchPort = "9200";
var filePath = "../indexedPDF/";
var serverIp = "localhost";	
var nbr=4;

var options = {
    port: 9200,
    method: 'POST',
    url: 'http://localhost:9200/trying-out-mapper-attachments/person/'+nbr,
};

    

function indexFile() { 
    fs.readFile(filePath +'test1.pdf', 'base64', function (err,data) {
        if (err) {
            return console.log(err);
        } else{     
            console.log("File loaded") ;                  
            var requestData = {   
                "cv" : data
            }  
            options.json = requestData;
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(data)
            }
            console.log("Request send with") ;   
            console.log(options.url); 
            request(options, function(err, response, body) {
                if (!err) {
                    if(response.statusCode === 200) {
                        //Parse response into JSON
                        var info = JSON.parse(body);
                        if (info) {
                            console.log(info);
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
    })
}
   
indexFile();