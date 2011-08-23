/*!
 * "Listener" for websocket clients.
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
var namiAction = require("nami");

function WebSocketListener(resources) {
	var self = this;
    this.clients = [];
    this.resources = resources;
    this.logger = require('log4js').getLogger('AsterTrace.WebSocket');
   	this.resources.websocket.sockets.on('connection', function (socket) {
		self.onWebSocketConnect(socket);
	});
    this.resources.nami.on('namiEvent', function (event) {
        self.onEventToClients(event);
    });
};

WebSocketListener.prototype.onEventToClients = function (event) {
    if (event.Event === 'DTMF') {
        return;
    }
    for (client in this.clients) {
        this.logger.debug('Dispatching event: ' + util.inspect(event));
    	this.clients[client].emit('event', event);
    }
};

WebSocketListener.prototype.onWebSocketDisconnect = function (message, socket) {
	this.logger.info('disconnect');
};
WebSocketListener.prototype.onWebSocketMessage = function (message, socket) {
    var self = this;
    this.logger.debug(
        socket.remoteAddres + ':' + socket.remotePort
        + ': ' + util.inspect(message)
    );
    message = JSON.parse(message);
    var action = new namiAction.Actions[message.name]();
    for (prop in message.arguments) {
        action.set(prop, message.arguments[prop]);
    }
	this.resources.nami.send(action, function (response) {
        self.logger.debug('Sending response: ' + util.inspect(response));
        response.action = message.name;
        response.id = message.id;
        socket.emit('response', response); 
    });
};
WebSocketListener.prototype.onWebSocketConnect = function (socket) {
	var self = this;
	this.clients.push(socket);
    socket.on('message', function (message) {
        self.onWebSocketMessage(message, socket);
    });
    socket.on('disconnect', function (message) {
        self.onWebSocketDisconnect(message, socket);
    });
};
WebSocketListener.prototype.shutdown = function () {
    for (client in this.clients) {
        this.logger.debug('Disconnecting: ' + this.clients[client].address);
        this.clients[client].disconnect();
    }
};

exports.listener = null;

exports.run = function (resources) {
    exports.listener = new WebSocketListener(resources);
};

exports.shutdown = function (resources) {
    exports.listener.shutdown();
};
