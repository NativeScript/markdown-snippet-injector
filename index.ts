#!/usr/bin/env node
declare var require;
import {SnippetInjector} from "./snippet-injector";
var yargsModule = require("yargs");

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

snippetInjector.process(rootDirectory);
snippetInjector.injectSnippets(docsRoot);
