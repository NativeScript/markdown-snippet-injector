declare var require;
import {SnippetInjector} from "./snippet-injector";
var fs = require("fs");
var path = require("path");

export class SnippetExtractor extends SnippetInjector {
    public targetDir: string = null;

    private fileForSnippet(id: string) {
        return path.join(this.targetDir, id) + ".json";
    }

    private keyForExtension(fileExtension: string): string {
        return fileExtension.toLowerCase().replace(/^\./, "");
    }

    protected hasSnippet(fileExtension: string, id: string): boolean {
        let snippetPath = this.fileForSnippet(id);
        let snippetData = {};
        if (fs.existsSync(snippetPath)) {
            const contents = fs.readFileSync(snippetPath, "utf8");
            snippetData = JSON.parse(contents);
        }
        if (snippetData[this.keyForExtension(fileExtension)]) {
            throw new Error(`Duplicate snippet: '${id}' for type: '${fileExtension}'`);
        }
        return false;
    }

    protected addSnippet(fileExtension: string, id: string, snippet: string): void {
        let snippetPath = this.fileForSnippet(id);
        let snippetData = {};
        if (fs.existsSync(snippetPath)) {
            const contents = fs.readFileSync(snippetPath, "utf8");
            snippetData = JSON.parse(contents);
        }
        snippetData[this.keyForExtension(fileExtension)] = snippet;
        fs.writeFileSync(snippetPath, JSON.stringify(snippetData, null, "    "));
    }
}
