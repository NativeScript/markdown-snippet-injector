#!/usr/bin/env node

var shelljs = require("shelljs");

shelljs.echo('Preparing for tests ...');

shelljs.rm('-rf', 'tests/docsroot-output');

shelljs.cp("-R", "tests/docsroot", "tests/docsroot-output");

shelljs.echo('Preparing for tests ... DONE');

