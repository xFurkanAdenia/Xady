import { MemoryConfigurationOptions } from '../MemoryConfigurationOptions';
import { Configuration } from '../Configuration';

/**
 * YamlConfigurationOptions - YAML-specific configuration options
 * Mirrors Bukkit's YamlConfigurationOptions
 */
export class YamlConfigurationOptions extends MemoryConfigurationOptions {
    private _indent: number = 2;
    private _copyHeader: boolean = true;
    private _copyFooter: boolean = true;
    private _parseComments: boolean = true;
    private _saveComments: boolean = true;
    private _quoteStyle: string = 'PLAIN';
    private _header: string | null = null;
    private _footer: string | null = null;

    constructor(configuration: Configuration) {
        super(configuration);
    }

    /**
     * Gets the indent size
     */
    public indent(): number {
        return this._indent;
    }

    /**
     * Sets the indent size
     */
    public indentWith(indent: number): YamlConfigurationOptions {
        if (indent < 2) {
            throw new Error('Indent must be at least 2');
        }
        this._indent = indent;
        return this;
    }

    /**
     * Checks if header should be copied
     */
    public copyHeader(): boolean {
        return this._copyHeader;
    }

    /**
     * Sets whether header should be copied
     */
    public copyHeaderWith(copy: boolean): YamlConfigurationOptions {
        this._copyHeader = copy;
        return this;
    }

    /**
     * Checks if footer should be copied
     */
    public copyFooter(): boolean {
        return this._copyFooter;
    }

    /**
     * Sets whether footer should be copied
     */
    public copyFooterWith(copy: boolean): YamlConfigurationOptions {
        this._copyFooter = copy;
        return this;
    }

    /**
     * Gets the header lines
     */
    public header(): string | null {
        return this._header;
    }

    /**
     * Sets the header
     */
    public headerWith(header: string | string[] | null): YamlConfigurationOptions {
        if (Array.isArray(header)) {
            this._header = header.join('\n');
        } else {
            this._header = header;
        }
        return this;
    }

    /**
     * Gets the footer lines
     */
    public footer(): string | null {
        return this._footer;
    }

    /**
     * Sets the footer
     */
    public footerWith(footer: string | string[] | null): YamlConfigurationOptions {
        if (Array.isArray(footer)) {
            this._footer = footer.join('\n');
        } else {
            this._footer = footer;
        }
        return this;
    }

    /**
     * Checks if comments should be parsed
     */
    public parseComments(): boolean {
        return this._parseComments;
    }

    /**
     * Sets whether comments should be parsed
     */
    public parseCommentsWith(parse: boolean): YamlConfigurationOptions {
        this._parseComments = parse;
        return this;
    }

    /**
     * Checks if comments should be saved
     */
    public saveComments(): boolean {
        return this._saveComments;
    }

    /**
     * Sets whether comments should be saved
     */
    public saveCommentsWith(save: boolean): YamlConfigurationOptions {
        this._saveComments = save;
        return this;
    }

    /**
     * Gets the quote style
     */
    public quoteStyle(): string {
        return this._quoteStyle;
    }

    /**
     * Sets the quote style (PLAIN, SINGLE, DOUBLE, FOLDED, LITERAL)
     */
    public quoteStyleWith(style: string): YamlConfigurationOptions {
        this._quoteStyle = style;
        return this;
    }
}
