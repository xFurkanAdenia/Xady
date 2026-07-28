import { FileConfiguration } from './FileConfiguration';
import { YamlConfigurationOptions } from './YamlConfigurationOptions';
import { parseDocument, stringify, Document } from 'yaml';

/**
 * YamlConfiguration - YAML implementation of FileConfiguration
 * Mirrors Bukkit's YamlConfiguration with full YAML feature support
 */
export class YamlConfiguration extends FileConfiguration {
    protected _yamlOptions: YamlConfigurationOptions;
    protected _comments: Map<string, string>;
    protected _header: string | null;
    protected _footer: string | null;
    protected _document: Document | null;

    constructor() {
        super();
        this._yamlOptions = new YamlConfigurationOptions(this);
        this._comments = new Map();
        this._header = null;
        this._footer = null;
        this._document = null;
    }

    public override options(): YamlConfigurationOptions {
        return this._yamlOptions;
    }

    public async loadFromString(contents: string): Promise<void> {
        this.map.clear();
        this._comments.clear();

        if (!contents || contents.trim().length === 0) {
            return;
        }

        try {
            // Parse YAML with comments preserved
            this._document = parseDocument(contents, {
                keepSourceTokens: true,
                logLevel: 'silent'
            });

            // Extract header
            if (this._document.commentBefore) {
                this._header = this._document.commentBefore;
            }

            // Extract footer
            if (this._document.comment) {
                this._footer = this._document.comment;
            }

            // Load data
            const data = this._document.toJSON();
            if (data && typeof data === 'object') {
                this.fromObject(data);
                
                // Extract comments
                this.extractComments(this._document.contents);
            }
        } catch (error: any) {
            throw new Error(`Failed to parse YAML: ${error.message}`);
        }
    }

    public async saveToString(): Promise<string> {
        const options = this._yamlOptions;
        let output = '';

        // Add header
        if (options.parseComments() && this._header) {
            const headerLines = this._header.split('\n');
            for (const line of headerLines) {
                output += '# ' + line + '\n';
            }
            if (output.length > 0) output += '\n';
        }

        // Convert data to YAML
        const data = this.toObject();
        
        const yamlOptions = {
            indent: options.indent(),
            lineWidth: 0,
            minContentWidth: 0,
            doubleQuotedAsJSON: false,
            doubleQuotedMinMultiLineLength: 40,
            defaultKeyType: 'PLAIN' as const,
            defaultStringType: this.getQuoteStyle(options.quoteStyle()),
            directives: true,
            keepUndefined: false,
            logLevel: 'silent' as const,
            schema: 'core',
            sortMapEntries: false,
            version: '1.2' as const
        };

        let yamlStr = stringify(data, yamlOptions as any);

        // Restore comments if enabled
        if (options.parseComments() && options.saveComments()) {
            yamlStr = this.restoreComments(yamlStr);
        }

        output += yamlStr;

        // Add footer
        if (options.parseComments() && this._footer) {
            const footerLines = this._footer.split('\n');
            for (const line of footerLines) {
                output += '# ' + line + '\n';
            }
        }

        return output;
    }

    /**
     * Sets header comment
     */
    public setHeader(header: string | string[] | null): void {
        if (Array.isArray(header)) {
            this._header = header.join('\n');
        } else {
            this._header = header;
        }
        this.markDirty();
    }

    /**
     * Gets header comment
     */
    public getHeader(): string | null {
        return this._header;
    }

    /**
     * Sets footer comment
     */
    public setFooter(footer: string | string[] | null): void {
        if (Array.isArray(footer)) {
            this._footer = footer.join('\n');
        } else {
            this._footer = footer;
        }
        this.markDirty();
    }

    /**
     * Gets footer comment
     */
    public getFooter(): string | null {
        return this._footer;
    }

    /**
     * Sets comment for a path
     */
    public setComment(path: string, comment: string | string[] | null): void {
        if (comment === null) {
            this._comments.delete(path);
        } else if (Array.isArray(comment)) {
            this._comments.set(path, comment.join('\n'));
        } else {
            this._comments.set(path, comment);
        }
        this.markDirty();
    }

    /**
     * Gets comment for a path
     */
    public getComment(path: string): string | null {
        return this._comments.get(path) || null;
    }

    /**
     * Removes comment from a path
     */
    public removeComment(path: string): void {
        this._comments.delete(path);
        this.markDirty();
    }

    /**
     * Gets all inline comments
     */
    public getComments(): Map<string, string> {
        return new Map(this._comments);
    }

    private extractComments(node: any, prefix: string = ''): void {
        if (!node) return;

        if (node.commentBefore) {
            this._comments.set(prefix, node.commentBefore);
        }

        if (node.items && Array.isArray(node.items)) {
            for (const item of node.items) {
                if (item && item.key && item.value) {
                    const key = String(item.key?.value || '');
                    const path = prefix ? `${prefix}.${key}` : key;

                    if (item.key?.commentBefore) {
                        this._comments.set(path, item.key.commentBefore);
                    }

                    if (item.value) {
                        this.extractComments(item.value, path);
                    }
                }
            }
        }
    }

    private restoreComments(yaml: string): string {
        const lines = yaml.split('\n');
        const result: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Try to match path from line
            const match = line.match(/^(\s*)([^:\s]+):/);
            if (match) {
                const indent = match[1];
                const key = match[2];
                
                // Find path based on indent level
                const path = this.findPathForKey(key, indent.length);
                const comment = this._comments.get(path);
                
                if (comment) {
                    const commentLines = comment.split('\n');
                    for (const commentLine of commentLines) {
                        result.push(indent + '# ' + commentLine);
                    }
                }
            }
            
            result.push(line);
        }

        return result.join('\n');
    }

    private findPathForKey(key: string, indentLevel: number): string {
        // Simple heuristic: use indent to determine nesting level
        // This is a simplified version - full implementation would track state
        return key;
    }

    private getQuoteStyle(style: string): 'PLAIN' | 'QUOTE_SINGLE' | 'QUOTE_DOUBLE' | 'BLOCK_FOLDED' | 'BLOCK_LITERAL' {
        switch (style.toUpperCase()) {
            case 'SINGLE': return 'QUOTE_SINGLE';
            case 'DOUBLE': return 'QUOTE_DOUBLE';
            case 'FOLDED': return 'BLOCK_FOLDED';
            case 'LITERAL': return 'BLOCK_LITERAL';
            default: return 'PLAIN';
        }
    }

    /**
     * Loads YAML from file synchronously
     */
    public static load(file: string): YamlConfiguration {
        const config = new YamlConfiguration();
        config.loadSync(file);
        return config;
    }

    /**
     * Loads YAML synchronously
     */
    private loadSync(file: string): void {
        const fs = require('fs');
        const content = fs.readFileSync(file, 'utf-8');
        
        // Use sync version of loadFromString
        this.map.clear();
        this._comments.clear();

        if (content && content.trim().length > 0) {
            this._document = parseDocument(content, {
                keepSourceTokens: true,
                logLevel: 'silent'
            });

            if (this._document.commentBefore) {
                this._header = this._document.commentBefore;
            }

            if (this._document.comment) {
                this._footer = this._document.comment;
            }

            const data = this._document.toJSON();
            if (data && typeof data === 'object') {
                this.fromObject(data);
                this.extractComments(this._document.contents);
            }
        }

        this._file = file;
        this._isDirty = false;
    }
}
