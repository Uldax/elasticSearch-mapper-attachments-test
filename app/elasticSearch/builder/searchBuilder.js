"use strict";
//Class that build request to send to elastic search serveur
/*
Param{
    requestString : string
    userId : string

    //Facultatif
    exact : (true || empty) or false
    doctype : field or array { field }
    orderBy : field or array { fieldName : string , order : (asc || desc)}
    date : array { begin, end } || array { before } || array { after}
}
*/

//Param send to search endPoint
const ALL_RESULTS = 0,
    EXACT_WORD = 1,
    RELEVANCE = 0,
    ALPHABETICAL = 1,
    DATE_ASC = 2,
    DATE_DESC = 3,
    ALL_DOCUMENT_TYPES = 0,
    //Type 
    BULLETIN_BOARD = 1,
    PDF = 2,
    DOC = 3,
    ALLOWED_TYPE = [PDF, DOC, BULLETIN_BOARD],
    REQUEST_STRING_FIELD = "requestString",
    USET_AUTH_FIELD = "userAuth",
    DOCTYPE_FIELD = "docType",
    ORDER_BY_FIELD = "orderBy",
    EXACT_FIELD = "exact",
    DATE_FIELD = "date",
    DATE_BEGIN = "begin",
    DATE_END = "end",

    //Ejs for query builder
    ejs = require('../../helper/elastic');


class SearchBuilder {
    constructor(requestParam, group_id, user_id) {
        this.requestParam = requestParam;
        this.group_id = group_id;
        this.user_id = user_id;
        console.log(requestParam);
    }

    userFilter() {
        var ejstest = ejs.BoolQuery()
            .should([
                ejs.TermsQuery('groups_ids', this.group_id),
                ejs.TermsQuery('created_by', this.user_id)
            ]);
        return ejstest;
    }

    //todo
    dateFilter() {
        var ejstest = ejs.BoolQuery()
            .should([
                ejs.TermsQuery('groups_ids', this.group_id),
                ejs.TermQuery('created_by', this.user_id)
            ]);
        return ejstest;
    }

    typeFilter() {
        if (this.reqBody[DOCTYPE_FIELD].constructor === Array) {
            return ejs.TermsQuery('type', this.reqBody[DOCTYPE_FIELD]);
        }
        else {
            return ejs.TermQuery('type', this.reqBody[DOCTYPE_FIELD]);
        }
    }

    filter() {
        let filters = [];
        //Always user filter
        filters.push(this.userFilter());

        //Date 
        if (this.reqBody.hasOwnProperty(DATE_FIELD) && this.reqBody.date.hasOwnProperty(DATE_BEGIN) && this.reqBody.date.hasOwnProperty(DATE_END)) {
            filters.push(this.dateFilter());
        }

        //Doc type 
        if (this.reqBody.hasOwnProperty(DOCTYPE_FIELD) && this.reqBody[DOCTYPE_FIELD] != ALL_DOCUMENT_TYPES) {
            filters.push(this.typeFilter());
        }
        return ejs.BoolQuery().must(filters);
    }

    query() {
        return ejs
            .BoolQuery()
            .should([
                ejs.MatchQuery('attachment.content', this.requestParam[REQUEST_STRING_FIELD]),
                ejs.MatchQuery('attachment.name', this.requestParam[REQUEST_STRING_FIELD]),
                ejs.MatchQuery('pinboard_label', this.requestParam[REQUEST_STRING_FIELD]),
                ejs.MatchQuery('pin_content', this.requestParam[REQUEST_STRING_FIELD])
            ]);
    }

    //Set field to retrive and highlight
    highlight() {
        return ejs
            .Highlight([
                "attachment.content",
                "pinboard_label",
                "layout_label",
                "pin_content",
                "attachment.name"
            ])
            .numberOfFragments(3);
    }

    //order can only be 'asc' or 'desc'
    orderBy() {
        if (this.reqBody[ORDER_BY_FIELD].constructor === Array) {
            let sorts = [];
            this.reqBody[ORDER_BY_FIELD].forEach(function (element) {
                sorts.push(ejs.Sort(element.fieldName).order(element.order));
            }, this);
            return sorts;
        } else {
            return ejs.Sort(this.reqBody[ORDER_BY_FIELD].fieldName).order(this.reqBody[ORDER_BY_FIELD].order);
        }
    }

    get search() {
        var ejs = ejs.Request()
            //exclude sources
            // try : source('','')
            .source(["pinboard_label",
                "created_by",
                "layout_label",
                "pin_content",
                "pin_vote",
                "attachment.title",
                "document_type",
                "file_label",
                "groups_ids"])
            .highlight(this.highlight())
            .query(
            this.query()
            );

        //OrderBy
        if (this.reqBody.hasOwnProperty(ORDER_BY_FIELD) && this.reqBody[ORDER_BY_FIELD] != RELEVANCE) {
            ejs.sort(this.orderBy());
        }

        //because ejs don't suport filter in bool we do it ourself
        ejs.toJSON().query.bool.filter = this.filter();
        ejs.toJSON().query.bool.minimum_should_match = 1;
        return ejs;
    }
}

module.exports = SearchBuilder;

