#! /usr/bin/env node
declare var require;
var fsModule = require("fs");
var yargsModule = require("yargs");
var pathModule = require("path");
var osModule = require('os');


export class SnippetInjector {
    private _storedSnippets;
    private _snippetTitle: string;
    private _sourceFileExtensionFilter: string;
    private _targetFileExtensionFilter: string;


    constructor() {
        this._storedSnippets = {}
        this._snippetTitle = "TypeScript";
    }

    get targetFileExtensionFilter(): string {
        return this._targetFileExtensionFilter;
    }

    set targetFileExtensionFilter(value: string) {
        this._targetFileExtensionFilter = value;
    }

    get sourceFileExtensionFilter(): string {
        return this._sourceFileExtensionFilter;
    }

    set sourceFileExtensionFilter(value: string) {
        this._sourceFileExtensionFilter = value;
    }

    get snippetTitle(): string {
        return this._snippetTitle;
    }

    set snippetTitle(value: string) {
        this._snippetTitle = value;
    }

    /**
    * Loads the code snippets from the source-tree at the specified location.
    * @param root The root of the source-tree to load the snippets from.
    */
    public process(root: string, docsRoot: string) {
        var lStat = fsModule.lstatSync(root);

        if (lStat.isDirectory()) {
            this.processDirectory(root);
        } else if (lStat.isFile()) {
            this.processFile(root);
        }

        if (Object.keys(this._storedSnippets).length > 0) {
            this.injectSnippetsIntoDocs(docsRoot);
        }
    }

    private injectSnippetsIntoDocs(root: string) {
        var lStat = fsModule.lstatSync(root);
        if (lStat.isDirectory()) {
            this.processDocsDirectory(root);
        } else if (lStat.isFile()) {
            this.processDocsFile(root);
        }
    }

    private processDocsFile(path: string) {
        console.log("Processing docs file: " + path);
        var fileContents = fsModule.readFileSync(path, 'utf8');
        var regExpOpen = /\<snippet id=\'((?:[a-z]+\-)+[a-z]+)\'\/\>/g;
        var match = regExpOpen.exec(fileContents);
        var hadMatches: boolean = false;
        while (match) {
            var matchedString = match[0];
            var placeholderId = match[1];
            if (this._storedSnippets[placeholderId] !== undefined) {
                hadMatches = true;
                var newString = this._storedSnippets[placeholderId];
                newString = "```" + this.snippetTitle + osModule.EOL + newString + osModule.EOL + "```";
                fileContents = fileContents.replace(matchedString, newString);
                console.log("Token replaced: " + matchedString);
            }
            match = regExpOpen.exec(fileContents);
        }

        if (hadMatches === true) {
            fsModule.writeFileSync(path, fileContents, "utf8");
        }
    }

    private processDocsDirectory(path: string) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDocsDirectory(fullPath);
            } else if (fileStat.isFile() && pathModule.extname(fullPath) === ".md") {
                this.processDocsFile(fullPath);
            }
        }
    }

    private processFile(path: string) {
        console.log("Processing source file: " + path);
        var extname = pathModule.extname(path);
        var fileContents = fsModule.readFileSync(path, 'utf8');
        var regExpOpen = /\/\/\s*>>\s*(([a-z]+\-)+[a-z]+)\s*/g;
        var regExpOpenReplacer = /\/\/\s*>>\s*(?:([a-z]+\-)+[a-z]+)\s+/g;
        var regExpCloseReplacer = /\/\/\s*<<\s*(?:([a-z]+\-)+[a-z]+)\s+/g;
        var match = regExpOpen.exec(fileContents);
        while (match) {
            var matchIndex = match.index;
            var matchLength = match[0].length;
            var idOfSnippet = match[1];
            if (this._storedSnippets[idOfSnippet] !== undefined) {
                match = regExpOpen.exec(fileContents);
                continue;
            }
            var regExpCurrentClosing = new RegExp("//\\s*<<\\s*" + match[1] + "\\s+");
            var indexOfClosingTag = regExpCurrentClosing.exec(fileContents).index;
            var snippet = fileContents.substr(matchIndex + matchLength, indexOfClosingTag - matchIndex - matchLength);
            snippet = snippet.replace(regExpOpenReplacer, "");
            snippet = snippet.replace(regExpCloseReplacer, "");
            console.log("Snippet resolved: " + snippet);
            this._storedSnippets[idOfSnippet] = snippet;
            match = regExpOpen.exec(fileContents);
        }
    }

    private processDirectory(path: string) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDirectory(path + '/' + currentFile);
            } else if (fileStat.isFile() && pathModule.extname(fullPath) === this.sourceFileExtensionFilter) {
                this.processFile(fullPath);
            }
        }
    }
}

var rootDirectory = yargsModule.argv.root;
var docsRoot = yargsModule.argv.docsroot;

if (rootDirectory === undefined) {
    throw new Error("Root of snippet sources not defined. Please specify sources root by using the --root parameter.");
}

if (docsRoot === undefined) {
    throw new Error("Root of documentation sources not defined. Please specify documentation root by using the --docsroot parameter.");
}

var snippetInjector = new SnippetInjector();
snippetInjector.sourceFileExtensionFilter = yargsModule.argv.sourceext || ".ts";
snippetInjector.targetFileExtensionFilter = yargsModule.argv.targetext || ".md";

snippetInjector.snippetTitle = yargsModule.argv.snippettitle;

snippetInjector.process(rootDirectory, docsRoot);
