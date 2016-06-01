//Class that build request to send to elastic search serveur

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
<<<<<<< HEAD
                    console.log("je passe par la");
                    //elasticBuilder.bodySearch.query(ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]))
=======
                    elasticBuilder.bodySearch.query(ejs.MatchQuery('attachment.content', elasticBuilder.buildParam[REQUEST_STRING_FIELD]))
>>>>>>> d9d912523d094dd4500fc236796cf0683f7202b4
                }
                console.log(elasticBuilder.consoleStatus);
                return elasticBuilder.bodySearch;
            } else {               
                throw Error("No request string provided")
            }
        },

        createDocument: function (fileName) {
            try {
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
            }
            catch (err) {
                console.log(err.message || err);
                return;
            }
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

    }

}
module.exports = elasticBuilder.publicObject;