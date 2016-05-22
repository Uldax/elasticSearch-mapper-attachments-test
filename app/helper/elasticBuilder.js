//Class that build request to send to elastic search serveur

//TODO : add date , exact , type  
const EXACT_WORD = 1
const DATE_ASC = 2;
const DATE_DESC = 3;
const ALPHABETICAL = 4;
const RELEVANCE = 5;
const PDF = "pdf"
const DOC = "docx"
const BULLETIN_BOARD = "unknown"

const ALLOWED_TYPE = [PDF, DOC, BULLETIN_BOARD];

const REQUEST_STRING_FIELD = "requestString";
const ORDER_BY_FIELD = "orderBy";
const DATE_FIELD = "date";
const DATE_BEGIN = "begin";
const DATE_END = "end";
const EXACT_FIELD = "exact";
const DOCTYPE_FIELD = "doctype";
const USET_AUTH_FIELD = "userAuth";


var utils = require("./utils");

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
    objectBuild: {},
    //List of console log
    consoleStatus: {},
    //List of param for builder
    buildParam: {},

    publicObject: {
        //parse buildParam  
        get: function (reqBody) {
            //console.log(reqBody);
            elasticBuilder.buildParam = reqBody;
            //Basic research 
            if (reqBody.hasOwnProperty(REQUEST_STRING_FIELD) && reqBody.requestString !== "") {
                elasticBuilder.objectBuild = elasticBuilder.base();
            } else {
                elasticBuilder.consoleStatus.orderBy = 'No querry string';
            }

            //OrderBy 
            if (reqBody.hasOwnProperty(ORDER_BY_FIELD) && reqBody.orderBy !== "") {
                elasticBuilder.orderBy();
            } else {
                elasticBuilder.consoleStatus.orderBy = 'false';
            }
            //Date 
            if (reqBody.hasOwnProperty(DATE_FIELD) && reqBody.date.hasOwnProperty(DATE_BEGIN) && reqBody.date.hasOwnProperty(DATE_END)) {
                elasticBuilder.date();
            } else {
                elasticBuilder.consoleStatus.date = 'false';
            }
            //Exact value 
            if (reqBody.hasOwnProperty('exact') && reqBody.orderBy == EXACT_WORD) {
                elasticBuilder.exact();
            } else {
                elasticBuilder.consoleStatus.exact = 'false';
            }
            //Doc type 
            if (reqBody.hasOwnProperty('doctype') && reqBody.orderBy !== "") {
                elasticBuilder.doctype();
            } else {
                elasticBuilder.consoleStatus.exact = 'false';
            }
            console.log(elasticBuilder.consoleStatus)
            return elasticBuilder.objectBuild;
        },

        //TODO : gulp or unique
        update: function (row) {
            //POST /website/blog/1/_update
            var test = {
                "doc": {
                    "tags": ["testing"],
                    "views": 0
                }
            }
        },

        createDocument: function (filename, base64file) {
            //id is set in url sent to elastic : http POST elastic/index/type/id
            var requestData = {
                "attachment": {
                    "_content": base64file,
                    "_name": filename,
                    "_date": utils.getTodayDateFormat(),
                    "_content_length": Buffer.byteLength(base64file)
                },
                "document_type": utils.getType(filename)
            }
            return requestData;
        },

        //TODO
        delete: function (row) {

        }
    },

    base: function () {
        return {
            //Source filtering
            "_source": ["attachment._name", "attachment._date"],
            //“How well does this document match this query clause?” the query clause also calculates a _score
            "query": {
                "match": {
                    "attachment.content": elasticBuilder.buildParam.requestString
                }
                //Filter :  “Does this document match this query clause?”  — no scores are calculated. Filter context is mostly used for filtering structured data, e.g.
            },
            "highlight": {
                "fields": {
                    "attachment.content": {
                        //todo change fragment size
                        "fragment_size": 150,
                        "number_of_fragments": 3
                    }
                }
            }
        };
    },

    //Pertinance, alphabétique , date croissante , date decroissante
    orderBy: function () {
        var orderByBuild = [];

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
        elasticBuilder.objectBuild.range = {
            "attachment.content._date": {
                "gte": elasticBuilder.buildParam.date.begin,
                "lt": elasticBuilder.buildParam.date.end
            }
        }
    },

    doctype: function () {
        elasticBuilder.objectBuild.filter = {
            "term": {
                "document_type": elasticBuilder.buildParam.doctype
            }
        }
    },

    exact: function () {

    }

}
module.exports = elasticBuilder.publicObject;