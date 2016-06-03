//Class that build request to send to elastic search serveur

/*
POST /opus/_search
{
   "from": 0,
   "size": 19,
   "_source": {
      "excludes": [
         "attachment._content"
      ]
   },
   "highlight": {
      "fields": {
         "attachment.content": {},
         "label": {},
         "pin" : {}
      },
      "number_of_fragments": 3
   },
   "query": {
      "bool": {
         "should": [
          {
            "match": {
              "attachment.content": {
                "query": "essai"
              }
            }     
          },
          {
            "match": {
              "label": {
                "query": "p"
              }
            }     
          }
        ],
         "filter": {
            "bool": {
               "should": [
                  {
                     "terms": {
                        "_id": [
                           "1029"
                        ]
                     }
                  },
                  {
                     "bool": {
                        "must": [
                           {
                              "terms": {
                                 "_d": [
                                    "1029",
                                    "1030"
                                 ]
                              }
                           }
                        ]
                     }
                  }
               ]
            }
         },
          "minimum_should_match" : 1
      }
   }
}

*/



//TODO : add date , exact , type  
const ALL_RESULTS = 0;
const EXACT_WORD = 1;
const RELEVANCE = 0;
const ALPHABETICAL = 1;
const DATE_ASC = 2;
const DATE_DESC = 3;
const ALL_DOCUMENT_TYPES = 0;
const BULLETIN_BOARD = 1;
const PDF = 2;
const DOC = 3;

const ALLOWED_TYPE = [PDF, DOC, BULLETIN_BOARD];

const REQUEST_STRING_FIELD = "requestString";
const USET_AUTH_FIELD = "userAuth";
const DOCTYPE_FIELD = "docType";
const ORDER_BY_FIELD = "orderBy";
const EXACT_FIELD = "exact";
const DATE_FIELD = "date";
const DATE_BEGIN = "begin";
const DATE_END = "end";


var utils = require("./utils");
var ejs = require('./elastic');

var folderName = "indexedDocuments";

var elasticSearchPort = "9200",
    protocol = "http",
    indexName = "opus",
    typeName = "document",
    serverIp = "localhost",
    folderName = "indexedDocuments";


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
    bodySearch: {},
    //List of console log
    consoleStatus: {},
    //List of param for builder
    buildParam: {},
    querrySet: false,

    publicObject: {
        //parse buildParam  
        search: function (reqBody) {
            console.log(reqBody);
            elasticBuilder.buildParam = reqBody;
            //Basic research 
            if (reqBody.hasOwnProperty(REQUEST_STRING_FIELD) && reqBody.requestString !== "") {
                console.log("Begin search ... ");
                elasticBuilder.bodySearch = elasticBuilder.base();

                //Date 
                if (reqBody.hasOwnProperty(DATE_FIELD) && reqBody.date.hasOwnProperty(DATE_BEGIN) && reqBody.date.hasOwnProperty(DATE_END)) {
                    elasticBuilder.date();
                } else {
                    elasticBuilder.consoleStatus.date = 'false';
                }
                //OrderBy 
                if (reqBody.hasOwnProperty(ORDER_BY_FIELD) && reqBody.orderBy != RELEVANCE) {
                    elasticBuilder.orderBy();
                } else {
                    elasticBuilder.consoleStatus.orderBy = 'false';
                }
                //Exact value 
                if (reqBody.hasOwnProperty('exact') && reqBody.orderBy == EXACT_WORD) {
                    elasticBuilder.exact();
                } else {
                    elasticBuilder.consoleStatus.exact = 'false';
                }
                //Doc type 
                if (reqBody.hasOwnProperty('doctype') && reqBody.orderBy != ALL_DOCUMENT_TYPES) {
                    elasticBuilder.doctype();
                } else {
                    elasticBuilder.consoleStatus.doctype = 'false';
                }

                //Normal 
                if (!elasticBuilder.querrySet) {
                    elasticBuilder.bodySearch.query(ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]))
                }
                console.log(elasticBuilder.consoleStatus);
                return elasticBuilder.bodySearch;
            } else {
                throw Error("No request string provided")
            }
        },

        createDocument: function (path,data) {
            console.log(path);
               console.log(data);
            try {
                var base64file = utils.base64_encode("../" + path );
                var fileSize = Buffer.byteLength(base64file);
                //id is set in url sent to elastic : http POST elastic/index/type/id
                var requestData = {
                    "attachment": {
                        "_content": base64file,
                        "_name": data.name,
                        "_content_length": fileSize
                    },
                    "document_type": utils.getType(path),
                    "insertDate": utils.getTodayDateFormat(),
                    "document_id" : data.document_id,
                    "version_id" : data.version_id                 
                }
                return requestData;
            }
            catch (err) {
                console.log(err.message || err);
                return;
            }
        },
        
        createPin : function(row){
            
            var requestData = {
                    "layou_label": row.label_layout,
                    "pin_id": row.pin_id,             
                    "pin_content" : row.pin_label,
                    "pinboard_label" : row.pinboard_label                 
                }
            if(row.hasOwnProperty('vote_pin')){
                requestData.pin_vote = row.vote_pin;
            }
            return requestData;
        },


        //TODO
        delete: function (row) {

        }
    },

    //Set field to retrive and highlight
    base: function () {

        return ejs.Request()
            .source(["attachment._name", "attachment._date"])
            .highlight(ejs.Highlight("attachment.content").numberOfFragments(3))
            .query(
            ejs.BoolQuery()
                .must(
                    ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]),
                    ejs.IdsQuery([1033,1007,1034,1009,1010,1020,1011,1038]).type("document")
                )
            )
    },

    //Pertinance, alphabétique , date croissante , date decroissante
    orderBy: function () {
        //https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-sort.html
        var orderByBuild = [];
        //sort query
        switch (buildParam.orderBy) {
            //TODO
            case EXACT_WORD:

                break;
            case DATE_ASC:
                orderByBuild.push({
                    "attachment.content._date": { "order": "asc" }
                })
                break;
            case DATE_DESC:
                orderByBuild.push({
                    "attachment.content._date": { "order": "desc" }
                })
                break;
            case ALPHABETICAL:
                orderByBuild.push({
                    ".content._name": { "order": "asc" }
                })
                break;

            default:
                break;
        }
        elasticBuilder.objectBuild.sort = orderByBuild;
    },

    date: function () {
        elasticBuilder.bodySearch
            .query(
            ejs.FilteredQuery(
                ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]),
                ejs.RangeFilter('insertDate')
                    .gte(elasticBuilder.buildParam[DATE_FIELD][DATE_BEGIN])
                    .lte(elasticBuilder.buildParam[DATE_FIELD][DATE_END])
            )
            )
        elasticBuilder.querrySet = true;
    },

    doctype: function () {
        elasticBuilder.objectBuild.filter = {
            "term": {
                "document_type": elasticBuilder.buildParam.doctype
            }
        }
    },

    exact: function () {

    },


    //Function which returns the JSON to index pins
    bulkPin: function (rows) {
        
        var myJson = [];
        
        for (var row = 0; row < rows.length; row++) {
            var layout_label_value = rows[row].label_layout;
            var pin_id_value = rows[row].pin_id;
            var pin_label_value = rows[row].label_pin;
            var pinboard_label_value = rows[row].label_pinboard;
            var pin_vote_value = rows[row].vote;
            
            myJson.push(
                { index: { _index: indexName, _type: 'pin', _id: pin_id_value } },
                {
                     layout_label: layout_label_value, 
                     pin_label: pin_label_value, 
                     pinboard_label: pinboard_label_value, 
                     pin_vote: pin_vote_value 
                }
            );
        }
        console.log(myJson);
        return myJson;
    },

}
module.exports = elasticBuilder.publicObject;
module.exports = elasticBuilder;

