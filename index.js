#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var snippet_injector_1 = require("./snippet-injector");
var yargsModule = require("yargs");
var rootDirectory = yargsModule.argv.root;
var docsRoot = yargsModule.argv.docsroot;
if (rootDirectory === undefined) {
    throw new Error("Root of snippet sources not defined. Please specify sources root by using the --root parameter.");
}
if (docsRoot === undefined) {
    throw new Error("Root of documentation sources not defined. Please specify documentation root by using the --docsroot parameter.");
}
var snippetInjector = new snippet_injector_1.SnippetInjector();
snippetInjector.toWrap = yargsModule.argv.w;
snippetInjector.sourceFileExtensionFilter = yargsModule.argv.sourceext || ".ts";
snippetInjector.targetFileExtensionFilter = yargsModule.argv.targetext || ".md";
snippetInjector.snippetTitles = yargsModule.argv.snippettitles;
snippetInjector.process(rootDirectory);
snippetInjector.injectSnippets(docsRoot);
//# sourceMappingURL=index.js.map