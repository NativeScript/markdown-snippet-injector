declare var require;
var fsModule = require("fs");
var pathModule = require("path");
var osModule = require('os');

const ws = "[\\t ]*";
const wsAndLine = "[\\r]?[\\n]?";

const expConsts = {
    name: "([a-z][a-zA-Z0-9-_]*)",
    hide: "\\(hide\\)" + ws,
    start: ">>" + ws,
    end: "<<" + ws
}

interface FormatSpec {
    commentStart: string;
    commentEnd: string;
    postProcess?: (string) => string;
}

const jsSpec: FormatSpec = {
    commentStart: ws + "\\/\\/" + ws,
    commentEnd: wsAndLine
}

const cssSpec: FormatSpec = {
    commentStart: ws + "\\/\\*" + ws,
    commentEnd: ws + "\\*\\/" + wsAndLine
}

const xmlSpec: FormatSpec = {
    commentStart: ws + "<!--" + ws,
    commentEnd: ws + "-->" + wsAndLine,
    postProcess: function (snippet: string) {
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
}

const htmlSpec: FormatSpec = xmlSpec;

export class SnippetInjector {
    private _storedSnippets;
    private _snippetTitles: string;
    private _sourceFileExtensionFilter: string = "";
    private _targetFileExtensionFilter: string = "";
    private _storedSourceTypes: Array<string>;
    private _storedTargetTypes: Array<string>;
    private _storedSourceTitles: any;
    private _toWrap: boolean;

    private _fileFormatSpecs = {};


    constructor() {
        this._storedSnippets = {};
    }

    get toWrap(): boolean {
        return this._toWrap;
    }

    set toWrap(value: boolean){
        this._toWrap = value;
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

    private init() {
        this._storedSourceTypes = this._sourceFileExtensionFilter.split('|');
        this._storedTargetTypes = this._targetFileExtensionFilter.split('|');

        if (this.snippetTitles === undefined) {
            this._storedSourceTitles = { '.js': 'JavaScript', '.ts': 'TypeScript' };
        } else {
            this._storedSourceTitles = {};
            var currentTitles = this.snippetTitles.split('|');
            for (var i = 0; i < this._storedSourceTypes.length; i++) {
                this._storedSourceTitles[this._storedSourceTypes[i]] = (currentTitles[i] || "")
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
    }

    /**
    * Loads the code snippets from the source-tree at the specified location.
    * @param root The root of the source-tree to load the snippets from.
    */
    public process(root: string) {
        var lStat = fsModule.lstatSync(root);

        this.init();

        for (var i = 0; i < this._storedSourceTypes.length; i++ ) {
            if (lStat.isDirectory()) {
                this.processDirectory(root, this._storedSourceTypes[i]);
            } else if (lStat.isFile()) {
                this.processFile(root, this._storedSourceTypes[i]);
            }
        }
    }

    public injectSnippets(docsRoot: string) {
        if (Object.keys(this._storedSnippets).length > 0) {
            var lStat = fsModule.lstatSync(docsRoot);
            for (var i = 0; i < this._storedTargetTypes.length; i++ ) {
                if (lStat.isDirectory()) {
                    this.processDocsDirectory(docsRoot, this._storedTargetTypes[i]);
                } else if (lStat.isFile()) {
                    this.processDocsFile(docsRoot, this._storedTargetTypes[i]);
                }
            }
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

    private replaceWrappedSnippetsWithCorespondingTags(fileContent): string {
        var content = "";
        content = fileContent.replace(/\<snippet id=['"]([a-zA-Z0-9\-]+)[\S\s]>[\S\s]*?<\/snippet>/g, "<snippet id='$1'/>");
        return content;
    }

    private wrapSnippetWithComments(snippetTag, snippetId): string {
        var wrappedSnippetTag = "";
        wrappedSnippetTag += "<snippet id='" + snippetId + "'>\n"
        wrappedSnippetTag += snippetTag
        wrappedSnippetTag += "\n</snippet>"

        return wrappedSnippetTag;
    }

    private processDocsFile(path: string, extensionFilter: string) {
        console.log("Processing docs file: " + path);
        var fileContents = fsModule.readFileSync(path, 'utf8');
        fileContents = this.replaceWrappedSnippetsWithCorespondingTags(fileContents);
        var regExpOpen = /\<\s*snippet\s+id=\'((?:[a-z]+\-)*[a-z]+)\'\s*\/\s*\>/g;
        var match = regExpOpen.exec(fileContents);
        var hadMatches: boolean = false;
        while (match) {
            var matchedString = match[0];
            var placeholderId = match[1];
            var finalSnippet = "";
            console.log("Placeholder resolved: " + matchedString);
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
                /* 
                    Check whether it should be wrapped or replaced.
                    If the tag is closed it will be replaced by the snippet.

                    From:
                    <snippet id="snippetId"/>
                    To:
                    {your_snippet}

                    If there is open and closed tag the snippet will be wrapped around snippet tag.

                    From:
                    <snippet id="snippetId"></snippet>
                    To:
                    <snippet id="snippetId">
                    {your_snippet}
                    </snippet>
                    
                */
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

        var spec: FormatSpec = this._fileFormatSpecs[extensionFilter];
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
            } else {
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
    }

    protected hasSnippet(fileExtension: string, id: string): boolean {
        return this._storedSnippets[fileExtension + id] !== undefined
    }

    protected addSnippet(fileExtension: string, id: string, snippet: string): void {
        this._storedSnippets[fileExtension + id] = snippet;
    }

    private lineHasText(line: string): boolean {
        return /\S/.test(line);
    }
    private trimWhiteSpaces(snippet: string): string {
        const hasText = (str: string) => /\S/;
        snippet = snippet.replace(/\t/g, "    "); // replace tabs with 4 spaces
        var lines = snippet.split(/\r?\n/);

        // Remove lines that has no text at start of snippet
        while (lines.length && !this.lineHasText(lines[0])) {
            lines.shift();
        }

        // Remove lines that has no text at end of snippet
        while (lines.length && !this.lineHasText(lines[lines.length - 1])) {
            lines.pop();
        }

        // Get starting spaces
        var minStartingSpaces = Number.POSITIVE_INFINITY;
        lines.forEach((line) => {
            if (/\S/.test(line)) {
                var spacesOnLeft = line.match(/^ */)[0].length;
                minStartingSpaces = Math.min(minStartingSpaces, spacesOnLeft);
            }
        })

        // Remove starting spaces
        if (minStartingSpaces !== Number.POSITIVE_INFINITY && minStartingSpaces > 0) {
            for (let i = 0; i < lines.length; i++) {
                if (/\S/.test(lines[i])) {
                    lines[i] = lines[i].substr(minStartingSpaces);
                }
            }
        }

        return lines.join(osModule.EOL);
    }

    private removeHiddenBlocks(snippet: string, spec: FormatSpec) {
        const startExp = new RegExp(spec.commentStart + expConsts.start + expConsts.hide + spec.commentEnd, "g");
        const endExp = new RegExp(spec.commentStart + expConsts.end + expConsts.hide + spec.commentEnd, "g");

        var match: RegExpMatchArray;
        var startMatches = new Array<RegExpMatchArray>();
        var endMatches = new Array<RegExpMatchArray>();

        while (match = startExp.exec(snippet)) {
            startMatches.push(match);
        }

        while (match = endExp.exec(snippet)) {
            endMatches.push(match);
        }

        // Validate
        if (startMatches.length !== endMatches.length) {
            throw new Error("Start and end match blockes don't match for snippet: " + snippet);
        }

        for (var i = startMatches.length - 1; i >= 0; i--) {
            let start = startMatches[i];
            let end = endMatches[i];
            snippet = snippet.substr(0, start.index) + snippet.substr(end.index + end[0].length);
        }

        return snippet;
    }
}
