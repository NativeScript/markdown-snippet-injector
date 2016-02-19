#! /usr/bin / env node
declare var require;
var fsModule = require("fs");
var yargsModule = require("yargs");
var pathModule = require("path");
var osModule = require('os');


export class SnippetInjector {
    private _storedSnippets;
    private _snippetTitles: string;
    private _sourceFileExtensionFilter: string;
    private _targetFileExtensionFilter: string;
    private _storedSourceTypes: Array<string>;
    private _storedSourceTitles: any;


    constructor() {
        this._storedSnippets = {};
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

    get snippetTitles(): string {
        return this._snippetTitles;
    }

    set snippetTitles(value: string) {
        this._snippetTitles = value;
    }

    private prepareSourceTypes() {
        this._storedSourceTypes = this._sourceFileExtensionFilter.split('|');
        if (this.snippetTitles === undefined) {
            this._storedSourceTitles = { '.js': 'JavaScript', '.ts': 'TypeScript' };
        } else {
            this._storedSourceTitles = {};
            var currentTitles = this.snippetTitles.split('|');
            for (var i = 0; i < this._storedSourceTypes.length; i++) {
                this._storedSourceTitles[this._storedSourceTypes[i]] = (currentTitles[i] || "")
            }
        }
    }

    /**
    * Loads the code snippets from the source-tree at the specified location.
    * @param root The root of the source-tree to load the snippets from.
    */
    public process(root: string, docsRoot: string) {
        var lStat = fsModule.lstatSync(root);

        this.prepareSourceTypes();
        for (var i = 0; i < this._storedSourceTypes.length; i++ ) {
            if (lStat.isDirectory()) {
                this.processDirectory(root, this._storedSourceTypes[i]);
            } else if (lStat.isFile()) {
                this.processFile(root, this._storedSourceTypes[i]);
            }
        }

        if (Object.keys(this._storedSnippets).length > 0) {
            this.injectSnippetsIntoDocs(docsRoot);
        }
    }

    private injectSnippetsIntoDocs(root: string) {
        var lStat = fsModule.lstatSync(root);
        if (lStat.isDirectory()) {
            this.processDocsDirectory(root, this._targetFileExtensionFilter);
        } else if (lStat.isFile()) {
            this.processDocsFile(root, this._targetFileExtensionFilter);
        }
    }

    private processDocsFile(path: string, extensionFilter: string) {
        console.log("Processing docs file: " + path);
        var fileContents = fsModule.readFileSync(path, 'utf8');
        var regExpOpen = /\<\s*snippet\s+id=\'((?:[a-z]+\-)+[a-z]+)\'\s*\/\s*\>/g;
        var match = regExpOpen.exec(fileContents);
        var hadMatches: boolean = false;
        while (match) {
            var matchedString = match[0];
            var placeholderId = match[1];
            var finalSnippet = "";

            for (var i = 0; i < this._storedSourceTypes.length; i++) {
                var currentSourceType = this._storedSourceTypes[i];
                var snippetForSourceType = this._storedSnippets[currentSourceType + placeholderId]
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
                fileContents = fileContents.replace(matchedString, finalSnippet);
                console.log("Token replaced: " + matchedString);
            }

            match = regExpOpen.exec(fileContents);
        }

        if (hadMatches === true) {
            fsModule.writeFileSync(path, fileContents, "utf8");
        }
    }

    private processDocsDirectory(path: string, extensionFilter: string) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDocsDirectory(fullPath, extensionFilter);
            } else if (fileStat.isFile() && pathModule.extname(fullPath) === extensionFilter) {
                this.processDocsFile(fullPath, extensionFilter);
            }
        }
    }

    private processFile(path: string, extensionFilter: string) {
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
            if (this._storedSnippets[extensionFilter + idOfSnippet] !== undefined) {
                match = regExpOpen.exec(fileContents);
                continue;
            }
            var regExpCurrentClosing = new RegExp("//\\s*<<\\s*" + match[1] + "\\s+");
            var indexOfClosingTag = regExpCurrentClosing.exec(fileContents).index;
            var snippet = fileContents.substr(matchIndex + matchLength, indexOfClosingTag - matchIndex - matchLength);
            snippet = snippet.replace(regExpOpenReplacer, "");
            snippet = snippet.replace(regExpCloseReplacer, "");
            console.log("Snippet resolved: " + snippet);
            this._storedSnippets[extensionFilter + idOfSnippet] = snippet;
            match = regExpOpen.exec(fileContents);
        }
    }

    private processDirectory(path: string, extensionFilter: string) {
        var files = fsModule.readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fullPath = path + '/' + currentFile;
            var fileStat = fsModule.lstatSync(fullPath);
            if (fileStat.isDirectory()) {
                this.processDirectory(path + '/' + currentFile, extensionFilter);
            } else if (fileStat.isFile() && pathModule.extname(fullPath) === extensionFilter) {
                this.processFile(fullPath, extensionFilter);
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

snippetInjector.snippetTitles = yargsModule.argv.snippettitles;

snippetInjector.process(rootDirectory, docsRoot);
