/**
 * Type declarations for third-party libraries without proper types
 */

declare module 'adm-zip' {
    class AdmZip {
        constructor(filePath?: string);
        getEntry(entryName: string): AdmZip.IZipEntry | null;
        getEntries(): AdmZip.IZipEntry[];
        readFile(entry: AdmZip.IZipEntry | string): Buffer | null;
        addFile(entryName: string, content: Buffer, comment?: string): void;
        writeZip(targetPath?: string): void;
        extractAllTo(targetPath: string, overwrite?: boolean): void;
    }

    namespace AdmZip {
        interface IZipEntry {
            entryName: string;
            name: string;
            comment: string;
            isDirectory: boolean;
            header: unknown;
            getData(): Buffer;
        }
    }

    export = AdmZip;
}

declare module 'yaml' {
    export function parse(src: string, options?: ParseOptions): unknown;
    export function parseDocument(src: string, options?: ParseOptions): Document;
    export function stringify(value: unknown, options?: StringifyOptions): string;

    export interface ParseOptions {
        keepSourceTokens?: boolean;
        logLevel?: 'silent' | 'warn' | 'error' | 'debug';
        strict?: boolean;
    }

    export interface StringifyOptions {
        indent?: number;
        lineWidth?: number;
        minContentWidth?: number;
    }

    export class Document {
        contents: unknown;
        comment: string | null;
        commentBefore: string | null;
        toJSON(): unknown;
        toString(): string;
    }
}
