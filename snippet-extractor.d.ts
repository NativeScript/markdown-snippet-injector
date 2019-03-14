import { SnippetInjector } from "./snippet-injector";
export declare class SnippetExtractor extends SnippetInjector {
    targetDir: string;
    private fileForSnippet;
    private keyForExtension;
    protected hasSnippet(fileExtension: string, id: string): boolean;
    protected addSnippet(fileExtension: string, id: string, snippet: string): void;
}
