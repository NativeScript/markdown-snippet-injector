"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var snippet_injector_1 = require("./snippet-injector");
var fs = require("fs");
var path = require("path");
var SnippetExtractor = (function (_super) {
    __extends(SnippetExtractor, _super);
    function SnippetExtractor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.targetDir = null;
        return _this;
    }
    SnippetExtractor.prototype.fileForSnippet = function (id) {
        return path.join(this.targetDir, id) + ".json";
    };
    SnippetExtractor.prototype.keyForExtension = function (fileExtension) {
        return fileExtension.toLowerCase().replace(/^\./, "");
    };
    SnippetExtractor.prototype.hasSnippet = function (fileExtension, id) {
        var snippetPath = this.fileForSnippet(id);
        var snippetData = {};
        if (fs.existsSync(snippetPath)) {
            var contents = fs.readFileSync(snippetPath, "utf8");
            snippetData = JSON.parse(contents);
        }
        if (snippetData[this.keyForExtension(fileExtension)]) {
            throw new Error("Duplicate snippet: '" + id + "' for type: '" + fileExtension + "'");
        }
        return false;
    };
    SnippetExtractor.prototype.addSnippet = function (fileExtension, id, snippet) {
        var snippetPath = this.fileForSnippet(id);
        var snippetData = {};
        if (fs.existsSync(snippetPath)) {
            var contents = fs.readFileSync(snippetPath, "utf8");
            snippetData = JSON.parse(contents);
        }
        snippetData[this.keyForExtension(fileExtension)] = snippet;
        fs.writeFileSync(snippetPath, JSON.stringify(snippetData, null, "    "));
    };
    return SnippetExtractor;
}(snippet_injector_1.SnippetInjector));
exports.SnippetExtractor = SnippetExtractor;
//# sourceMappingURL=snippet-extractor.js.map