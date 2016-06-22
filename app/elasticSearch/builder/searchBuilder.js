"use strict";
//Class that build request to send to elastic search serveur

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


var ejs = require('../../helper/elastic'),
    utils = require("../../helper/utils"),
    conf = require("../../config"),
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

var elasticSearchBuilder = {
    bodySearch: {},
    //List of console log
    consoleStatus: {},
    //List of param for builder
    buildParam: {},
    querrySet: false,

    publicObject: {
        //parse buildParam  
        search: function (reqBody) {
            elasticSearchBuilder.buildParam = reqBody;
            //Basic research 
            if (reqBody.hasOwnProperty(REQUEST_STRING_FIELD) && reqBody.requestString !== "") {
                console.log("Begin search ... ");
                elasticSearchBuilder.bodySearch = elasticSearchBuilder.base();

                //Date 
                if (reqBody.hasOwnProperty(DATE_FIELD) && reqBody.date.hasOwnProperty(DATE_BEGIN) && reqBody.date.hasOwnProperty(DATE_END)) {
                    elasticSearchBuilder.date();
                } else {
                    elasticSearchBuilder.consoleStatus.date = 'false';
                }
                //OrderBy 
                if (reqBody.hasOwnProperty(ORDER_BY_FIELD) && reqBody.orderBy != RELEVANCE) {
                    elasticSearchBuilder.orderBy();
                } else {
                    elasticSearchBuilder.consoleStatus.orderBy = 'false';
                }
                //Exact value 
                if (reqBody.hasOwnProperty('exact') && reqBody.orderBy == EXACT_WORD) {
                    elasticSearchBuilder.exact();
                } else {
                    elasticSearchBuilder.consoleStatus.exact = 'false';
                }
                //Doc type 
                if (reqBody.hasOwnProperty('doctype') && reqBody.orderBy != ALL_DOCUMENT_TYPES) {
                    elasticSearchBuilder.doctype();
                } else {
                    elasticSearchBuilder.consoleStatus.doctype = 'false';
                }

                //Normal 
                if (!elasticSearchBuilder.querrySet) {
                    elasticSearchBuilder.bodySearch.query(ejs.MatchQuery('attachment.content', elasticSearchBuilder.buildParam[REQUEST_STRING_FIELD]))
                }
                console.log(elasticSearchBuilder.consoleStatus);
                return elasticSearchBuilder.bodySearch;
            } else {
                throw Error("No request string provided")
            }
        },   
    },

    //Set field to retrive and highlight
    base: function () {
        return ejs.Request()
            .source(["attachment._name", "attachment._date"])
            .highlight(ejs.Highlight("attachment.content").numberOfFragments(3))
            .query(
            ejs.BoolQuery()
                .must(
                ejs.MatchQuery('attachment.content', elasticSearchBuilder.buildParam[REQUEST_STRING_FIELD]),
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
        elasticSearchBuilder.objectBuild.sort = orderByBuild;
    },

    date: function () {
        elasticSearchBuilder.bodySearch
            .query(
            ejs.FilteredQuery(
                ejs.MatchQuery('attachment.content', elasticSearchBuilder.buildParam[REQUEST_STRING_FIELD]),
                ejs.RangeFilter('insertDate')
                    .gte(elasticSearchBuilder.buildParam[DATE_FIELD][DATE_BEGIN])
                    .lte(elasticSearchBuilder.buildParam[DATE_FIELD][DATE_END])
            )
            )
        elasticSearchBuilder.querrySet = true;
    },

    doctype: function () {
        elasticSearchBuilder.objectBuild.filter = {
            "term": {
                "document_type": elasticSearchBuilder.buildParam.doctype
            }
        }
    },

    exact: function () {

    },

}
module.exports = elasticSearchBuilder.publicObject;

