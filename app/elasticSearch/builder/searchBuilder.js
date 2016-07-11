"use strict";
//Class that build request to send to elastic search serveur
/*
Param{
    requestString : string
    userId : int
    page : int

    //Facultatif
    exact : true or (false || empty)
    doctype : field or array [field]  
    orderBy : object or array [{ fieldName : string , order : (asc || desc)}]
    date : object { begin, end } || object { before } || object { after}
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
    BULLETIN_BOARD = "unknown",
    PDF = "pdf",
    DOC = "doc",
    ALLOWED_TYPE = [PDF, DOC, BULLETIN_BOARD],
    REQUEST_STRING_FIELD = "requestString",
    USET_AUTH_FIELD = "userAuth",
    DOCTYPE_FIELD = "docType",
    ORDER_BY_FIELD = "orderBy",
    EXACT_FIELD = "exact",
    DATE_FIELD = "date",
    DATE_BEGIN = "begin",
    DATE_END = "end",
    DATE_BEFORE = "before",
    DATE_AFTER = "after",

    //Ejs for query builder
    ejs = require('../../helper/elastic.js'),
    //Elastic value
    TIE_BREAKER = 0.3;

class SearchBuilder {
    constructor(requestParam, group_id, user_id, size) {
        //Todo verification
        this.requestParam = requestParam;
        this.group_id = group_id;
        this.user_id = user_id;
        this.size = size;
        this.fromValue = (requestParam.page > 1) ? ((requestParam.page - 1) * size) : 0
        this.fieldToSearch = [
            'attachment.content',
            'attachment.name',
            'pinboard_label',
            'pin_content',
            'layout_label',
        ];
        console.log(requestParam);
    }

    userFilter() {
        var ejstest = ejs.BoolQuery()
            .should([
                ejs.TermsQuery('groups_ids', this.group_id),
                ejs.TermQuery('created_by', this.user_id)
            ]);
        return ejstest;
    }


    dateFilter() {
        let requestDate = this.requestParam[DATE_FIELD];
        let range = {
            "insertDate": {}
        };

        if (requestDate.hasOwnProperty(DATE_BEGIN)) {
            range.insertDate.gte = requestDate[DATE_BEGIN];
            range.insertDate.lte = requestDate[DATE_END];
        } else if (requestDate.hasOwnProperty(DATE_BEFORE)) {
            range.insertDate.lte = requestDate[DATE_BEFORE];
        } else if (requestDate.hasOwnProperty(DATE_AFTER)) {
            range.insertDate.gte = requestDate[DATE_AFTER];
        } else {
            console.log("SearchBuilder : erreur in date");
        }
        return { range };

    }

    typeFilter() {
        if (this.requestParam[DOCTYPE_FIELD].constructor === Array) {
            return ejs.TermsQuery('document_type', this.requestParam[DOCTYPE_FIELD]);
        }
        else {
            return ejs.TermQuery('document_type', this.requestParam[DOCTYPE_FIELD]);
        }
    }

    //Create all filter based on request object
    filter() {
        let filters = [];
        //Always user filter
        filters.push(this.userFilter());
        //Doc type 
        if (this.requestParam.hasOwnProperty(DOCTYPE_FIELD) && this.requestParam[DOCTYPE_FIELD] != ALL_DOCUMENT_TYPES) {
            filters.push(this.typeFilter());
        }

        let ejsFilter = ejs.BoolQuery().must(filters);

        //Not supported by ejs : Date 
        if (this.requestParam.hasOwnProperty(DATE_FIELD) &&
            ((this.requestParam[DATE_FIELD].hasOwnProperty(DATE_BEGIN) && this.requestParam[DATE_FIELD].hasOwnProperty(DATE_END)) ||
                this.requestParam[DATE_FIELD].hasOwnProperty(DATE_BEFORE) ||
                this.requestParam[DATE_FIELD].hasOwnProperty(DATE_AFTER))) {
            ejsFilter.toJSON().bool.must.push(this.dateFilter());
        }

        return ejsFilter;

    }

    suggest() {
        let suggestObject = {
                "text": this.requestParam[REQUEST_STRING_FIELD],
                "simple_phrase": {
                    "phrase": {
                        "size": 1,
                        "real_word_error_likelihood": 0.95,
                        "max_errors": 0.5,
                        "gram_size": 2
                    }
                }
            
        }
        for (let i = 0; i < this.fieldToSearch.length; i++) {
            let element = this.fieldToSearch[i];
            let propertyName = 'my-suggest-' + i;
            suggestObject[propertyName] = {
                "field" : element,
            }
        }
        console.log(suggestObject);
        return suggestObject;
    }

    query() {
        //fieldToSearch
        return ejs
            .BoolQuery()
            .should(ejs.MultiMatchQuery(this.fieldToSearch, this.requestParam[REQUEST_STRING_FIELD])
                .tieBreaker(TIE_BREAKER)
            );
    }

    //Set field to retrive and highlight
    highlight() {
        return ejs
            .Highlight(this.fieldToSearch)
            .numberOfFragments(3);
    }

    //order can only be 'asc' or 'desc'
    orderBy() {
        if (this.requestParam[ORDER_BY_FIELD].constructor === Array) {
            let sorts = [];
            this.requestParam[ORDER_BY_FIELD].forEach(function (element) {
                sorts.push(ejs.Sort(element.fieldName).order(element.order));
            }, this);
            return sorts;
        } else {
            return ejs.Sort(this.requestParam[ORDER_BY_FIELD].fieldName).order(this.requestParam[ORDER_BY_FIELD].order);
        }
    }

    get search() {
        var ejsBody = ejs.Request()
            .from(this.fromValue)
            .size(this.size)
            //exclude sources
            .source("*", ["attachment._content"])
            .highlight(this.highlight())
            .query(
            this.query()
            );

        //OrderBy
        if (this.requestParam.hasOwnProperty(ORDER_BY_FIELD) && this.requestParam[ORDER_BY_FIELD] != RELEVANCE) {
            ejsBody.toJSON().sort = this.orderBy();
        }

        //because ejs don't suport filter in bool, so we do it ourself
        ejsBody.toJSON().query.bool.filter = this.filter();
        ejsBody.toJSON().query.bool.minimum_should_match = 1;
        //ejs doesn't support complexe phrase filter too
        ejsBody.toJSON().suggest = this.suggest();
        return ejsBody;
    }
}

module.exports = SearchBuilder;

