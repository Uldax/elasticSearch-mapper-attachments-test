"use strict";
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
//Param send to search endPoint
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

//TODO move to conf
const ALLOWED_TYPE = [PDF, DOC, BULLETIN_BOARD];

const REQUEST_STRING_FIELD = "requestString";
const USET_AUTH_FIELD = "userAuth";
const DOCTYPE_FIELD = "docType";
const ORDER_BY_FIELD = "orderBy";
const EXACT_FIELD = "exact";
const DATE_FIELD = "date";
const DATE_BEGIN = "begin";
const DATE_END = "end";


var ejs = require('./elastic'),
    utils = require("./utils"),
    conf = require("../config"),
    indexName = conf.elastic.mainIndex;


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

        createDocument: function (path, data) {
                var base64file = utils.base64_encode("../" + path);
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
                    "document_id": data.document_id,
                    "version_id": data.version_id,
                    //if not set , add values instead of add to array
                    "document_groups_ids": []
                }
                return requestData;           
        },

        //Files are in config/script under elasticSearch folder
        addGroupToFile: function (group_id, document_id) {
            var requestData = {           
                "query": {
                    "term": {
                        "document_id": document_id
                    }
                },
                "script": {
                    "file": "addGroupFile",
                    "params": {
                        "new_group": group_id
                    }
                }

            }
            return requestData;
        },
      
        removeGroupToDocument : function (group_id, document_id) {
            var requestData = {
                "script": {
                    "file": "removeGroup",
                    "params": {
                        "new_group": group_id
                    }
                },
                "query": {
                    "term": {
                        "document_id": document_id
                    }
                }

            }
            return requestData;
        },

        createPin: function (row,groupIds) {
            var requestData = {
                "layou_label": row.label_layout,
                "pin_id": row.pin_id,
                "pin_content"  : row.pin_label,
                "pinboard_label" : row.pinboard_label,
                "pin_groups_ids" : groupIds,
            }
            return requestData;
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
                var log_data_id_value = rows[row].log_data_id;

                myJson.push(
                    { index: { _index: indexName, _type: 'pin', _id: log_data_id_value } },
                    {
                        layout_label: layout_label_value,
                        pin_label: pin_label_value,
                        pinboard_label: pinboard_label_value,
                        pin_vote: pin_vote_value,
                        pin_id: pin_id_value
                    }
                );
            }
            return myJson;
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
                ejs.IdsQuery([1033, 1007, 1034, 1009, 1010, 1020, 1011, 1038]).type("document")
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

}
module.exports = elasticBuilder.publicObject;

