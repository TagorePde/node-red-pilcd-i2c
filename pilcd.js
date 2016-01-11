/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var util = require("util");
    var spawn = require('child_process').spawn;
    var fs = require('fs');

    var gpioCommand = __dirname + '/nrlcd';

    if (!fs.existsSync("/dev/ttyAMA0")) { // unlikely if not on a Pi
        //util.log("Info : Ignoring Raspberry Pi specific node.");
        throw "Info : Ignoring Raspberry Pi specific node.";
    }

    if (!(1 & parseInt ((fs.statSync(gpioCommand).mode & parseInt ("777", 8)).toString (8)[0]))) {
        util.log("[rpi-lcd] Error : " + gpioCommand + " needs to be executable.");
        throw "Error : " + gpioCommand + " must to be executable.";
    }

    function PiLcdNode(n) {
        RED.nodes.createNode(this, n);
        this.address = n.address;
        this.cols = n.cols;
        this.rows = n.rows;
        var node = this;

        function inputlistener(msg) {
            var out = msg.payload.toString();
            if (RED.settings.verbose) { node.log("inp: " + msg.payload); }
            if (node.child !== null) { node.child.stdin.write(msg.payload + "\n"); }
            else { node.warn("Command not running"); }
        }

        if (node.address !== undefined && node.cols !== undefined && node.rows !== undefined) {
            node.child = spawn(gpioCommand, [node.address, node.cols, node.rows]);
            node.running = true;

            if (RED.settings.verbose) { node.log("address: " + node.address + " (" + node.cols + "x" + node.rows + ") :"); }
            node.on("input", inputlistener);

            node.child.stdout.on('data', function(data) {
                if (RED.settings.verbose) { node.log("out: " + data + " :"); }
            });

            node.child.stderr.on('data', function(data) {
                if (RED.settings.verbose) { node.log("err: " + data + " :"); }
            });

            node.child.on('close', function(code) {
                if (RED.settings.verbose) { node.log("ret: " + code + " :"); }
                node.child = null;
                node.running = false;
            });

            node.child.on('error', function(err) {
                if (err.errno === "ENOENT") { node.warn('Command not found'); }
                else if (err.errno === "EACCES") { node.warn('Command not executable'); }
                else { node.log('error: ' + err); }
            });

            node.child.on('exit', function(code, signal) {
                if (RED.settings.verbose) { node.log("exi: " + code + " :"); }
                node.child = null;
                node.running = false;
            })

        }
        else {
            node.error("Missing or invalid data");
        }

        var wfi = function(done) {
            if (!node.running) {
                if (RED.settings.verbose) { node.log("end"); }
                done();
                return;
            }
            setTimeout(function() { wfi(done); }, 333);
        }

        node.on("close", function(done) {
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.child.stdin.write("c:lose" + node.pin);
                node.child.kill('SIGKILL');
            }
            wfi(done);
        });

    }
    RED.nodes.registerType("rpi-lcd-i2c", PiLcdNode);
}
