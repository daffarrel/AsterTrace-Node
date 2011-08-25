/*!
 * Will save call statuses to mongo.
 *
 * Copyright 2011 Marcelo Gornstein <marcelog@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
var events = require("events");

function CallListener(resources) {
    CallListener.super_.call(this);
	var self = this;
    this.resources = resources;
    this.logger = require('log4js').getLogger('AsterTrace.Mongo.Call');
    this.logger.debug('Init');
    this.mongo = this.resources.mongo;
    this.resources.nami.on('namiEventDial', function (event) { self.onDial(event); });
    this.resources.nami.on('namiEventVarSet', function (event) { self.onVarSet(event); });
}
util.inherits(CallListener, events.EventEmitter);

CallListener.prototype.saveCall = function (call) {
    call.save(function (err) {
        if (err !== null) {
            this.logger.error("Error saving call: " + err);
        }
    });
};

CallListener.prototype.getCall = function (uniqueId, callback) {
    this.mongo.CallModel.findOne({uniqueId1: uniqueId}, function (err, obj) {
        if (err !== null) {
            this.logger.error("Error getting call: " + err);
        } else {
            callback(obj);
        }
    });
};

CallListener.prototype.onVarSet = function (event) {
    var self = this;
    if (event.variable === 'DIALEDTIME') {
        this.logger.debug('Set DIALEDTIME: ' + util.inspect(event));
        this.getCall(event.uniqueid, function (call) {
            if (call !== null) {
                call.dialedTime = event.value;
                self.saveCall(call);
            }
        });
    } else if (event.variable === 'ANSWEREDTIME') {
        this.logger.debug('Set ANSWEREDTIME: ' + util.inspect(event));
        this.getCall(event.uniqueid, function (call) {
            if (call !== null) {
                call.answeredTime = event.value;
                self.saveCall(call);
            }
        });
    } else if (event.variable === 'HANGUPCAUSE') {
        this.logger.debug('Set HANGUPCAUSE: ' + util.inspect(event));
        this.getCall(event.uniqueid, function (call) {
            if (call !== null) {
                call.hangupCause = event.value;
                call.end = Date.now();
                self.saveCall(call);
            }
        });
    }
};

CallListener.prototype.onDial = function (event) {
    var self = this, callEntity = new this.mongo.CallModel();
    if (event.subevent === 'Begin') {
        this.logger.debug('Begin Call: ' + util.inspect(event));
        callEntity.channel1 = event.channel;
        callEntity.uniqueId1 = event.uniqueid;
        callEntity.channel2 = event.destination;
        callEntity.uniqueId2 = event.destuniqueid;
        callEntity.dialString = event.dialstring;
        callEntity.clidNum = event.calleridnum;
        callEntity.clidName = event.calleridname;
        this.saveCall(callEntity);
    } else if (event.subevent === 'End') {
        this.logger.debug('End Call: ' + util.inspect(event));
        this.getCall(event.uniqueid, function (call) {
            if (call !== null) {
                call.dialStatus = event.dialstatus;
                self.saveCall(call);
            }
        });
    }
};

CallListener.prototype.shutdown = function () {
};

exports.listener = null;

exports.run = function (resources) {
    exports.listener = new CallListener(resources);
};

exports.shutdown = function (resources) {
    exports.listener.shutdown();
};
