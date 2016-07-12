"use strict";
//Class that build request to send to elastic search serveur
const ejs = require('../../helper/elastic.js'),
    REQUEST_STRING_FIELD = "requestString";

class SuggestBuilder {
    constructor(size) {
        this.size = size || 10;
    }

    buildSuggest(requestParam, group_id, user_id) {
        this.requestParam = requestParam;
        this.group_id = group_id;
        this.user_id = user_id;
        var ejsBody = ejs.Request()
            .size(this.size)
            //exclude sources
            .source(false)
            .query(
            this.query()
            )
            .highlight(this.highlight());

        //because ejs don't suport filter in bool, so we do it ourself
        ejsBody.toJSON().query.bool.filter = this.filter();
        ejsBody.toJSON().query.bool.minimum_should_match = 1;
        return ejsBody;
    }

    userFilter() {
        var ejstest = ejs.BoolQuery()
            .should([
                ejs.TermsQuery('groups_ids', this.group_id),
                ejs.TermQuery('created_by', this.user_id)
            ]);
        return ejstest;
    }

    //Create all filter based on request object
    filter() {
        let filters = [];
        //Always user filter
        filters.push(this.userFilter());
        let ejsFilter = ejs.BoolQuery().must(filters);
        return ejsFilter;
    }

    query() {
        //fieldToSearch
          return ejs
            .BoolQuery()
            .should(ejs.MatchQuery("_all", this.requestParam[REQUEST_STRING_FIELD])
            .operator("and")
            );     
    }

    //Set field to retrive and highlight
    highlight() {
        return ejs
            .Highlight("_all")
            .fragmentSize(20)
            .numberOfFragments(1);
    }

}

module.exports = SuggestBuilder;

