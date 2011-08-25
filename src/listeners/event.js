/*!
 * Will save every event to mongo.
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
function EventListener(resources) {
	var self = this;
    this.resources = resources;
    this.logger = require('log4js').getLogger('AsterTrace.Mongo.Event');
    this.logger.debug('Init');
    this.mongo = this.resources.mongo;
    this.resources.nami.on('namiEvent', function (event) {
        self.onEventToMongo(event);
    });
}

EventListener.prototype.onEventToMongo = function (event) {
    if (event.Event === 'DTMF') {
        return;
    }
    this.logger.debug('Saving event: ' + util.inspect(event));
    var eventEntity = new this.mongo.EventModel();
    eventEntity.uniqueId = typeof (event.uniqueid) !== 'undefined' ? event.uniqueid : '';
    eventEntity.name = typeof (event.event) !== 'undefined' ? event.event : '';
    eventEntity.channel = typeof (event.channel) !== 'undefined' ? event.channel : '';
    eventEntity.event = JSON.stringify(event); 
    eventEntity.save(function (err) {
        if (err !== null) {
            this.logger.error("Error saving event: " + err);
        }
    });
};

EventListener.prototype.shutdown = function () {
};

exports.listener = null;

exports.run = function (resources) {
    exports.listener = new EventListener(resources);
};

exports.shutdown = function (resources) {
    exports.listener.shutdown();
};
