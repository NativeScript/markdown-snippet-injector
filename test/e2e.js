var assert = require('assert'),
  fs = require('fs'),
  shelljs = require("shelljs"),
  rootFolder = "test/root",
  docsrootFolder = "./test/docsroot-output";

function preparedemo() {
  console.log('Preparing for tests ...');
  shelljs.rm('-rf', docsrootFolder);
  shelljs.cp("-R", "test/docsroot", docsrootFolder);
  console.log('Preparing for tests ... DONE');
}

function hasPattern(pattern, shouldExists, callback) {
  fs.readFile(docsrootFolder + '/test.md', function read(err, data) {
    if (err) {
      callback('Pattern ' + pattern + ' is NOT found because of an error: ' + err);
    } else {
      if (data.toString().indexOf(pattern) === -1) {
        callback(shouldExists ? 'Pattern ' + pattern + ' is NOT found' : null);
      } else {
        callback(shouldExists ? null : 'Pattern ' + pattern + ' WAS found. This is NOT expected.');
      }

    }
  });
}

describe('markdown-snippet-injector', function () {

  beforeEach(function (done) {
    preparedemo();
    done();
  });

  //TODO: Add tests for hidden fields

  it('should process XML snippets', function (done) {
    shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".xml"');
    hasPattern("<snippet id='xml-snippet'/>", false, done);
  });

  it('should process TypeScript snippets', function (done) {
    shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".ts"');
    hasPattern("<snippet id='ts-snippet'/>", false, done);
  });

  it('should process CSS snippets', function (done) {
    shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
    hasPattern("<snippet id='css-snippet'/>", false, done);
  });

  it('should NOT process snippetIds that are not defined in source', function (done) {
    shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
    hasPattern("<snippet id='cssSnippet'/>", true, done);
  });
});