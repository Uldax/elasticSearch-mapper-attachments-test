//TODO : add date , exact , type  

const EXACT_WORD = 1
const DATE_ASC = 2;
const DATE_DESC = 3;
const ALPHABETICAL = 4;
const RELEVANCE = 5;

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
        build: function (objectParam) {
            elasticBuilder.buildParam = objectParam;
            //OrderBy state
            if (objectParam.hasOwnProperty('requestString') && objectParam.requestString !== "") {
                elasticBuilder.objectBuild = elasticBuilder.base();
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
            return elasticBuilder.objectBuild;
        }
    },

    base: function () {
        return {
            //Source filtering
            "_source": "attachment._name",
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
        return;
    },

    date: function () {
        elasticBuilder.objectBuild.range = {
            "attachment.content._date": {
                "gte": elasticBuilder.objectParam.date.begin,
                "lt": elasticBuilder.objectParam.date.end
            }
        }
        return;

    },

    doctype: function () {

    },

    exact: function () {

    }

}
module.exports = elasticBuilder.publicObject;