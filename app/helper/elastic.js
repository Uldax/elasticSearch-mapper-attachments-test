//Pour trie date
// "range" : {
//     "date" : {
//         "gte" : "now-1d/d",
//         "lt" :  "now/d"
//     }
// }    
//TODO : add date , exact , type  

const EXACT_WORD = 1

/*
Param{
    userAuth,
    queryString,
    exact,
    doctype,
    orderBy,
    date{
        begin,
        end
    }
}
*/
var elasticBuilder = {
    objectBuild : {},
    //List of console log
    consoleStatus: {},
    //List of param for builder
    buildParam: {},     
    
    base: function() {
        return {
            "_source": "my_attachment._name",
            "query": {
                "match": {
                    "my_attachment.content": elasticBuilder.buildParam.requestString
                }
            },
            "highlight": {
                "fields": {
                    "my_attachment.content": {
                        "fragment_size": 150,
                        "number_of_fragments": 3
                    }
                }
            }
        };
    },

    orderBy: function () {
        switch (buildParam.orderBy) {
            case value:

                break;

            default:
                break;
        }
    },
    
    date: function () {

    },

    doctype: function () {

    },

    exact: function () {

    },
    
    publicObject : {    
        //parse buildParam  
        build: function(objectParam) {          
            elasticBuilder.buildParam = objectParam;
             //OrderBy state
            if (objectParam.hasOwnProperty('requestString') && objectParam.requestString !== "") {
                objectBuild = elasticBuilder.base();
            } else {
                elasticBuilder.consoleStatus.orderBy = 'No querry string';
            }
            
            //OrderBy state
            if (objectParam.hasOwnProperty('orderBy') && objectParam.orderBy !== "") {
                elasticBuilder.orderBy();
            } else {
                elasticBuilder.consoleStatus.orderBy = 'false';
            }
            //Date state
            if (objectParam.hasOwnProperty('date') && objectParam.date.hasOwnProperty("begin") && objectParam.date.hasOwnProperty("end")) {
                elasticBuilder.date();
            } else {
                elasticBuilder.consoleStatus.date = 'false';
            }
            //exact state
            if (objectParam.hasOwnProperty('exact') && objectParam.orderBy == EXACT_WORD) {
                elasticBuilder.exact();
            } else {
                elasticBuilder.consoleStatus.exact = 'false';
            }
            //doctype state
            if (objectParam.hasOwnProperty('doctype') && objectParam.orderBy !== "") {
                elasticBuilder.doctype();
            } else {
                elasticBuilder.consoleStatus.exact = 'false';
            }
            console.log(elasticBuilder.consoleStatus)
            return objectBuild;
        }
    }

}
module.exports = elasticBuilder.publicObject;