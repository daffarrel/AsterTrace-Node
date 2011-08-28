/*!
 * Main entry point. AsterTrace application.
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
var util = require("util");

function MyApp() {
	var self = this;
    this.connected = false;
    this.bootstrap = require(__dirname + "/bootstrap/bootstrap.js");
    this.bootstrap.run();
    this.resources = this.bootstrap.resources;
    this.listeners = this.bootstrap.listeners;
    this.logger = this.bootstrap.logger;
    this.clients = [];
    process.on('SIGINT', function () {
        self.quit();
    });
    this.resources.nami.on('namiConnected', function () {
        this.connected = true;
    });
    this.resources.nami.on('namiInvalidPeer', function (data) {
        self.onInvalidPeer(data);
    });
    this.resources.nami.on('namiLoginIncorrect', function () {
        self.onLoginIncorrect();
    });
}

MyApp.prototype.quit = function () {
    this.logger.info('Quitting');
    this.bootstrap.shutdown();
    process.exit();
};

MyApp.prototype.onInvalidPeer = function (data) {
    this.logger.fatal('invalid peer: ' + util.inspect(data));
    process.exit();
};
MyApp.prototype.onLoginIncorrect = function (data) {
    this.logger.fatal('login incorrect');
    process.exit();
};

new MyApp(process.env.NAMI_CONFIG_DIR);

