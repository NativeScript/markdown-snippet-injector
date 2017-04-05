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

function contain(pattern, callback) {
  hasPattern(pattern, true, callback);
}

function notContain(pattern, callback) {
  hasPattern(pattern, false, callback);
}

describe('markdown-snippet-injector', function () {

  beforeEach(function (done) {
    preparedemo();
    done();
  });

  describe('XML',
    function () {
      it('should process XML snippets', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".xml"');
        notContain("<snippet id='xml-snippet'/>", function () {
          notContain("<snippet id='xml-snippet'>", function () {
            contain('<Label fontSize="20" text="{{ itemName }}"/>', done);
          });
        });
      });

      it('should process XML snippets and wrap it', function (done) {
        shelljs.exec('node index.js -w --root=./test/root --docsroot=./test/docsroot-output --sourceext=".xml"');
        notContain("<snippet id='xml-snippet'/>", function () {
          contain("<snippet id='xml-snippet'>", function () {
            contain('<Label fontSize="20" text="{{ itemName }}"/>', done);
          });
        });
      });
    });

  describe('TypeScript',
    function () {
      it('should process TypeScript snippets', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".ts"');
        notContain("<snippet id='ts-snippet'/>", function () {
          notContain("<snippet id='ts-snippet'>", function () {
            notContain("</snippet>", function () {
              contain('return a + b;', done);
            });
          });
        });
      });

      it('should process TypeScript snippets and wrap', function (done) {
        shelljs.exec('node index.js -w --root=./test/root --docsroot=./test/docsroot-output --sourceext=".ts"');
        notContain("<snippet id='ts-snippet'/>", function () {
          contain("<snippet id='ts-snippet'>", function () {
            contain("</snippet>", done);
          });
        });
      });
    });

  describe('CSS',
    function () {
      it('should process CSS snippets', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
        notContain("<snippet id='css-snippet'/>", function () {
          notContain("<snippet id='css-snippet'>", function () {
            notContain("</snippet>", function () {
              contain('text-align: center;', done);
            });
          });
        });
      });

      it('should process CSS snippets and wrap', function (done) {
        shelljs.exec('node index.js -w --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
        notContain("<snippet id='css-snippet'/>", function () {
          contain("<snippet id='css-snippet'>", function () {
            contain("</snippet>", function () {
              contain('text-align: center;', done);
            });
          });
        });
      });

      it('should keep hidden the marked area in CSS', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
        notContain("visibility: hidden;", done);
      });

      it('should NOT process snippetIds that are not defined in source', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
        contain("<snippet id='cssSnippet'/>", function () {
          notContain("<snippet id='cssSnippet'>", done);
        });
      });

      it('should update the already processed snippet tags', function (done) {
        shelljs.exec('node index.js --root=./test/root --docsroot=./test/docsroot-output --sourceext=".css"');
        contain("<snippet id='css-already-processed'>", function () {
          contain("</snippet>", function () {
            contain("color: red;", done);
          });
        });
      });
    });
});