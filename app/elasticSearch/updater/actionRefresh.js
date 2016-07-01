"use strict";

var elasticService = require("../elasticService");
var utils = require("../../helper/utils");

class ActionRefresh {

    //create the promise
    get promise() {
        return this.reflect(elasticService.refresh())
    }

    reflect(promise) {
        if (utils.isFunction(promise)) {
            return promise().then(function (v) { return { v: v, status: "resolve" } },
                function (e) { return { e: (e.message || e), status: "rejected" } });
        } else {
            return promise.then(function (v) { return { v: v, status: "resolve" } },
                function (e) { return { e: (e.message || e), status: "rejected" } });
        }
    }

}

module.exports = ActionRefresh;