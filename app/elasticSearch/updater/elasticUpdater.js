"use strict";
//Read scheduled update from database and execute thm all
//Used of notify/listen form pgsql to wake up
const updateModel = require('../../models/update.js'),
    elasticService = require("../elasticService"),
    IndexAction = require("./indexAction"),
    RefreshAction = require("./refreshAction"),
    utils = require("../../helper/utils");

//Singleton : http://amanvirk.me/singleton-classes-in-es6/
let instance = null;

class ElasticUpdater {
    constructor(timeBetweenUpdate) {
        if (!instance) {
            instance = this;
        }
        //Boolean used to know if we can update now or wait
        this.curentUpdate = false;
        //All results states after update
        this.state = [];
        //Int used to know when to put the updater in sleep mode
        this.previousStateLength = 0;
        //Action that failed to notify
        this.rejectResult = [];
        //As the name say
        this.timeBetweenUpdate = (timeBetweenUpdate || 5000);

        //test singleton :
        this.time = new Date();
        return instance;
    }

    //Read the table update and create/exeute indexAction
    readUpdateTable() {
        //store the scope to use it in promise
        const that = this;
        return new Promise(function (resolve, reject) {
            //Dont't do the update process if another update is already running
            if (!that.curentUpdate) {
                let updateIds = [];
                that.curentUpdate = true;
                that.state = [];
                that.rejectResult = [];

                updateModel.getUpdates()
                    .then(function (rows) {
                        let actionPromises = [];
                        //Don't need closure thanks to let keyword instead of var
                        for (let row in rows) {
                            if (rows.hasOwnProperty(row)) {
                                let element = rows[row];
                                actionPromises.push(new IndexAction(element));
                                updateIds.push(element.update_id);
                            }
                        }
                        if (actionPromises.length > 0) {
                            //Refresh to allowed direct search after update
                            actionPromises.push(new RefreshAction());
                            //Serie of asynchrone action
                            return that.pseries(actionPromises);
                        } else {
                            //Go to the next bloc 'then'
                            return Promise.resolve();
                        }
                    })
                    .then(function (lastResult) {
                        //In case of no action
                        if (lastResult && lastResult.state == "rejected") {
                            that.state.push(lastResult);
                        }
                        that.curentUpdate = false;
                        if (updateIds.length > 0) {
                            that.rejectResult = that.state.filter(x => x.status === "rejected");
                            //TODO: handle rejected by sending notification to opus 
                            return updateModel.deleteUpdatesByIds(updateIds);
                        } else {
                            return Promise.resolve();
                        }
                    })
                    .then(function () {
                        //resolve the main promise
                        resolve();
                    })
                    .catch(function (err) {
                        that.curentUpdate = false;
                        reject(err.message || err);
                    });
            }
            else {
                reject("Update already in progress");
            }
        });
    }

    //called every 'timeBetweenUpdate' ms if awake
    executeUpdate() {
        const that = this;
        this.readUpdateTable().then(function () {
            if (this.previousStateLength === 0 && this.state.length === 0) {
                return this.sleep();
            }
            this.previousStateLength = this.state.length;
            console.log("Numbers of failed :" + this.rejectResult.length + " / " + this.state.length);
            this.rejectResult.forEach(function (element) {
                console.log(element.e);
            }, this);
            setTimeout(that.executeUpdate.bind(this), that.timeBetweenUpdate);
            //insert the scope in 'then' : this now equal ElasticUpdater instead of promise
        }.bind(this))
            .catch(function (err) {
                console.log(err);
            });
    }

    wakeUp() {
        console.log("wake up");
        updateModel.unlisten();
        this.executeUpdate();
    }

    sleep() {
        console.log("sleep");
        updateModel.listenChannel("update", this.wakeUp.bind(this));
    }

    //Promise.all(), but which doesn't execute the promises in paralle
    pseries(list) {
        let p = Promise.resolve();
        const that = this,
            size = list.length;
        //La méthode reduce() applique une fonction qui est un « accumulateur »
        // traite chaque valeur d'une liste (de la gauche vers la droite)
        // afin de la réduire à une seule valeur.
        return list.reduce(function (action, nextAction) {
            return action = action.then(function (res) {
                if (res) {
                    //Store the result of every action
                    that.state.push(res);
                    console.log(that.state.length + " of " + size);
                }
                return nextAction.promise;
            });
        }, p);

    }
}

module.exports = ElasticUpdater;
