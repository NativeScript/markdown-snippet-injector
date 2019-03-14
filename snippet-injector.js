"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fsModule = require("fs");
var pathModule = require("path");
var osModule = require('os');
var ws = "[\\t ]*";
var wsAndLine = "[\\r]?[\\n]?";
var expConsts = {
    name: "([a-z][a-zA-Z0-9-_]*)",
    hide: "\\(hide\\)" + ws,
    start: ">>" + ws,
    end: "<<" + ws
};
var jsSpec = {
    commentStart: ws + "\\/\\/" + ws,
    commentEnd: wsAndLine
};
var cssSpec = {
    commentStart: ws + "\\/\\*" + ws,
    commentEnd: ws + "\\*\\/" + wsAndLine
};
var xmlSpec = {
    commentStart: ws + "<!--" + ws,
    commentEnd: ws + "-->" + wsAndLine,
    postProcess: function (snippet) {
        var bindingRegEx = new RegExp("\{\{.*\}\}");
        var newLineChar = '\n';
        var linesOfSnippet = snippet.split(newLineChar);
        var newSnippet = linesOfSnippet.length > 0 ? "" : snippet;
        for (var i = 0; i < linesOfSnippet.length; i++) {
            var currentLine = linesOfSnippet[i];
            var match = bindingRegEx.exec(currentLine);
            if (match) {
                currentLine = "\{\% raw \%\}" + currentLine + "\{\% endraw \%\}";
            }
            newSnippet += currentLine;
            if (i < linesOfSnippet.length - 1) {
                newSnippet += newLineChar;
            }
        }
        return newSnippet;
    }
};
var htmlSpec = xmlSpec;
var SnippetInjector = (function () {
    function SnippetInjector() {
        this._sourceFileExtensionFilter = "";
        this._targetFileExtensionFilter = "";
        this._fileFormatSpecs = {};
        this._storedSnippets = {};
    }
    Object.defineProperty(SnippetInjector.prototype, "toWrap", {
        get: function () {
            return this._toWrap;
        },
        set: function (value) {
            this._toWrap = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SnippetInjector.prototype, "targetFileExtensionFilter", {
        get: function () {
            return this._targetFileExtensionFilter;
        },
        set: function (value) {
            this._targetFileExtensionFilter = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SnippetInjector.prototype, "sourceFileExtensionFilter", {
        get: function () {
            return this._sourceFileExtensionFilter;
        },
        set: function (value) {
            this._sourceFileExtensionFilter = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SnippetInjector.prototype, "snippetTitles", {
        get: function () {
            return this._snippetTitles;
        },
        set: function (value) {
            this._snippetTitles = value;
        },
        enumerable: true,
        configurable: true
    });
    SnippetInjector.prototype.init = function () {
        this._storedSourceTypes = this._sourceFileExtensionFilter.split('|');
        this._storedTargetTypes = this._targetFileExtensionFilter.split('|');
        if (this.snippetTitles === undefined) {
            this._storedSourceTitles = { '.js': 'JavaScript', '.ts': 'TypeScript' };
        }
        else {
            this._storedSourceTitles = {};
            var currentTitles = this.snippetTitles.split('|');
            for (var i = 0; i < this._storedSourceTypes.length; i++) {
                this._storedSourceTitles[this._storedSourceTypes[i]] = (currentTitles[i] || "");
            }
        }
        this._fileFormatSpecs['.cs'] = jsSpec;
        this._fileFormatSpecs['.swift'] = jsSpec;
        this._fileFormatSpecs['.h'] = jsSpec;
        this._fileFormatSpecs['.m'] = jsSpec;
        this._fileFormatSpecs['.js'] = jsSpec;
        this._fileFormatSpecs['.ts'] = jsSpec;
        this._fileFormatSpecs['.java'] = jsSpec;
        this._fileFormatSpecs['.cs'] = jsSpec;
        this._fileFormatSpecs['.xml'] = xmlSpec;
        this._fileFormatSpecs['.xaml'] = xmlSpec;
        this._fileFormatSpecs['.css'] = cssSpec;
        this._fileFormatSpecs['.html'] = htmlSpec;
    };
    SnippetInjector.prototype.process = function (root) {
        var lStat = fsModule.lstatSync(root);
        this.init();
        for (var i = 0; i < this._storedSourceTypes.length; i++) {
            if (lStat.isDirectory()) {
                this.processDirectory(root, this._storedSourceTypes[i]);
            }
            else if (lStat.isFile()) {
                this.processFile(root, this._storedSourceTypes[i]);
            }
        }
    };
    SnippetInjector.prototype.injectSnippets = function (docsRoot) {
        if (Object.keys(this._storedSnippets).length > 0) {
            var lStat = fsModule.lstatSync(docsRoot);
            for (var i = 0; i < this._storedTargetTypes.length; i++) {
                if (lStat.isDirectory()) {
                    this.processDocsDirectory(docsRoot, this._storedTargetTypes[i]);
                }
                else if (lStat.isFile()) {
                    this.processDocsFile(docsRoot, this._storedTargetTypes[i]);
                }
            }
        }
    };
    SnippetInjector.prototype.processDirectory = function (path, extensionFilter) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDirectory(path + '/' + currentFile, extensionFilter);
            }
            else if (fileStat.isFile() && pathModule.extname(fullPath) === extensionFilter) {
                this.processFile(fullPath, extensionFilter);
            }
        }
    };
    SnippetInjector.prototype.replaceWrappedSnippetsWithCorespondingTags = function (fileContent) {
        var content = "";
        content = fileContent.replace(/\<snippet id=['"]([a-zA-Z0-9\-]+)[\S\s]>[\S\s]*?<\/snippet>/g, "<snippet id='$1'/>");
        return content;
    };
    SnippetInjector.prototype.wrapSnippetWithComments = function (snippetTag, snippetId) {
        var wrappedSnippetTag = "";
        wrappedSnippetTag += "<snippet id='" + snippetId + "'>\n";
        wrappedSnippetTag += snippetTag;
        wrappedSnippetTag += "\n</snippet>";
        return wrappedSnippetTag;
    };
    SnippetInjector.prototype.processDocsFile = function (path, extensionFilter) {
        console.log("Processing docs file: " + path);
        var fileContents = fsModule.readFileSync(path, 'utf8');
        fileContents = this.replaceWrappedSnippetsWithCorespondingTags(fileContents);
        var regExpOpen = /\<\s*snippet\s+id=\'((?:[a-z]+\-)*[a-z]+)\'\s*\/\s*\>/g;
        var match = regExpOpen.exec(fileContents);
        var hadMatches = false;
        while (match) {
            var matchedString = match[0];
            var placeholderId = match[1];
            var finalSnippet = "";
            console.log("Placeholder resolved: " + matchedString);
            for (var i = 0; i < this._storedSourceTypes.length; i++) {
                var currentSourceType = this._storedSourceTypes[i];
                var snippetForSourceType = this._storedSnippets[currentSourceType + placeholderId];
                if (snippetForSourceType !== undefined) {
                    hadMatches = true;
                    if (finalSnippet.length > 0) {
                        finalSnippet += osModule.EOL;
                    }
                    var currentSnippetTitle = this._storedSourceTitles[currentSourceType] || "";
                    finalSnippet += "```" + currentSnippetTitle + osModule.EOL + snippetForSourceType + osModule.EOL + "```";
                }
            }
            if (finalSnippet.length > 0) {
                if (this.toWrap) {
                    var tmpMatchedString = this.wrapSnippetWithComments(matchedString, placeholderId);
                    fileContents = fileContents.replace(matchedString, tmpMatchedString);
                }
                fileContents = fileContents.replace(matchedString, finalSnippet);
                console.log("Token replaced: " + matchedString);
            }
            match = regExpOpen.exec(fileContents);
        }
        if (hadMatches === true) {
            fsModule.writeFileSync(path, fileContents, "utf8");
        }
    };
    SnippetInjector.prototype.processDocsDirectory = function (path, extensionFilter) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDocsDirectory(fullPath, extensionFilter);
            }
            else if (fileStat.isFile() && pathModule.extname(fullPath) === extensionFilter) {
                this.processDocsFile(fullPath, extensionFilter);
            }
        }
    };
    SnippetInjector.prototype.processFile = function (path, extensionFilter) {
        console.log("Processing source file: " + path);
        var spec = this._fileFormatSpecs[extensionFilter];
        var regExpOpen = new RegExp(spec.commentStart + expConsts.start + expConsts.name + spec.commentEnd, "g");
        var regExpOpenReplacer = new RegExp(spec.commentStart + expConsts.start + expConsts.name + spec.commentEnd, "g");
        var regExpCloseReplacer = new RegExp(spec.commentStart + expConsts.end + expConsts.name + spec.commentEnd, "g");
        var fileContents = fsModule.readFileSync(path, 'utf8');
        var match = regExpOpen.exec(fileContents);
        while (match) {
            var matchIndex = match.index;
            var matchLength = match[0].length;
            var idOfSnippet = match[1];
            if (this.hasSnippet(extensionFilter, idOfSnippet)) {
                match = regExpOpen.exec(fileContents);
                continue;
            }
            var regExpCurrentClosingEOF = new RegExp(spec.commentStart + expConsts.end + idOfSnippet + "$");
            var closingTagMatchEOF = regExpCurrentClosingEOF.exec(fileContents);
            var indexOfClosingTag;
            if (!closingTagMatchEOF) {
                var regExpCurrentClosing = new RegExp(spec.commentStart + expConsts.end + idOfSnippet + "([^-])" + spec.commentEnd);
                var closingTagMatch = regExpCurrentClosing.exec(fileContents);
                if (!closingTagMatch) {
                    throw new Error("Closing tag not found for: " + idOfSnippet);
                }
                indexOfClosingTag = closingTagMatch.index;
            }
            else {
                indexOfClosingTag = closingTagMatchEOF.index;
            }
            var snippet = fileContents.substr(matchIndex + matchLength, indexOfClosingTag - matchIndex - matchLength);
            snippet = snippet.replace(regExpOpenReplacer, "");
            snippet = snippet.replace(regExpCloseReplacer, "");
            snippet = this.trimWhiteSpaces(snippet);
            if (spec.postProcess) {
                snippet = spec.postProcess(snippet);
            }
            snippet = this.removeHiddenBlocks(snippet, spec);
            console.log("Snippet resolved: " + idOfSnippet);
            this.addSnippet(extensionFilter, idOfSnippet, snippet);
            match = regExpOpen.exec(fileContents);
        }
    };
    SnippetInjector.prototype.hasSnippet = function (fileExtension, id) {
        return this._storedSnippets[fileExtension + id] !== undefined;
    };
    SnippetInjector.prototype.addSnippet = function (fileExtension, id, snippet) {
        this._storedSnippets[fileExtension + id] = snippet;
    };
    SnippetInjector.prototype.lineHasText = function (line) {
        return /\S/.test(line);
    };
    SnippetInjector.prototype.trimWhiteSpaces = function (snippet) {
        var hasText = function (str) { return /\S/; };
        snippet = snippet.replace(/\t/g, "    ");
        var lines = snippet.split(/\r?\n/);
        while (lines.length && !this.lineHasText(lines[0])) {
            lines.shift();
        }
        while (lines.length && !this.lineHasText(lines[lines.length - 1])) {
            lines.pop();
        }
        var minStartingSpaces = Number.POSITIVE_INFINITY;
        lines.forEach(function (line) {
            if (/\S/.test(line)) {
                var spacesOnLeft = line.match(/^ */)[0].length;
                minStartingSpaces = Math.min(minStartingSpaces, spacesOnLeft);
            }
        });
        if (minStartingSpaces !== Number.POSITIVE_INFINITY && minStartingSpaces > 0) {
            for (var i = 0; i < lines.length; i++) {
                if (/\S/.test(lines[i])) {
                    lines[i] = lines[i].substr(minStartingSpaces);
                }
            }
        }
        return lines.join(osModule.EOL);
    };
    SnippetInjector.prototype.removeHiddenBlocks = function (snippet, spec) {
        var startExp = new RegExp(spec.commentStart + expConsts.start + expConsts.hide + spec.commentEnd, "g");
        var endExp = new RegExp(spec.commentStart + expConsts.end + expConsts.hide + spec.commentEnd, "g");
        var match;
        var startMatches = new Array();
        var endMatches = new Array();
        while (match = startExp.exec(snippet)) {
            startMatches.push(match);
        }
        while (match = endExp.exec(snippet)) {
            endMatches.push(match);
        }
        if (startMatches.length !== endMatches.length) {
            throw new Error("Start and end match blockes don't match for snippet: " + snippet);
        }
        for (var i = startMatches.length - 1; i >= 0; i--) {
            var start = startMatches[i];
            var end = endMatches[i];
            snippet = snippet.substr(0, start.index) + snippet.substr(end.index + end[0].length);
        }
        return snippet;
    };
    return SnippetInjector;
}());
exports.SnippetInjector = SnippetInjector;
//# sourceMappingURL=snippet-injector.js.map