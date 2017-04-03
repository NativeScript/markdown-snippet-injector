#!/usr/bin/env node

var shelljs = require("shelljs");

shelljs.echo('Preparing for tests ...');

shelljs.rm('-rf', 'test/docsroot-output');

shelljs.cp("-R", "test/docsroot", "test/docsroot-output");

shelljs.echo('Preparing for tests ... DONE');

