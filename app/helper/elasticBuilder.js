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
var ejs = require('./elastic');

var folderName = "indexedDocuments";

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
            //console.log(reqBody);
            elasticBuilder.buildParam = reqBody;
            //Basic research 
            if (reqBody.hasOwnProperty(REQUEST_STRING_FIELD) && reqBody.requestString !== "") {
                elasticBuilder.bodySearch = elasticBuilder.base();

                //Date 
                if (reqBody.hasOwnProperty(DATE_FIELD) && reqBody.date.hasOwnProperty(DATE_BEGIN) && reqBody.date.hasOwnProperty(DATE_END)) {
                    elasticBuilder.date();
                } else {
                    elasticBuilder.consoleStatus.date = 'false';
                }
                //OrderBy 
                if (reqBody.hasOwnProperty(ORDER_BY_FIELD) && reqBody.orderBy !== "") {
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
                if (reqBody.hasOwnProperty('doctype') && reqBody.orderBy !== "") {
                    elasticBuilder.doctype();
                } else {
                    elasticBuilder.consoleStatus.exact = 'false';
                }

                //Normal 
                if (!elasticBuilder.querrySet) {
                    console.log("je passe par la");
                    elasticBuilder.bodySearch.query(ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]))
                }
                return elasticBuilder.bodySearch;
            } else {
                throw Error("No request string provided")
            }
        },

        createDocument: function (fileName) {
            var base64file = utils.base64_encode("../" + folderName + "/" + fileName);
            var fileSize = Buffer.byteLength(base64file);
            //id is set in url sent to elastic : http POST elastic/index/type/id
            var requestData = {
                "attachment": {
                    "_content": base64file,
                    "_name": fileName,
                    "_content_length": fileSize
                },
                "document_type": utils.getType(fileName),
                "insertDate": utils.getTodayDateFormat()
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

    }

}
module.exports = elasticBuilder.publicObject;