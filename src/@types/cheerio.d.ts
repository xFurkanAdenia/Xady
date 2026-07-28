/**
 * Type declarations for cheerio
 * jQuery-like HTML parser for Node.js
 */

declare module 'cheerio' {
    interface CheerioAPI {
        <T = Element>(selector: string, context?: string | Element | CheerioAPI): Cheerio<T>;
        <T = Element>(element: T | T[]): Cheerio<T>;
        
        load(html: string | Buffer, options?: CheerioOptions): CheerioAPI;
        html(dom?: string | Element | Element[] | Cheerio<Element>): string;
        xml(dom?: string | Element | Element[] | Cheerio<Element>): string;
        text(elements: Element | Element[] | Cheerio<Element>): string;
        
        readonly root: () => Cheerio<Document>;
        readonly contains: (container: Element, contained: Element) => boolean;
        readonly parseHTML: (html: string) => Element[];
    }
    
    interface Cheerio<T = Element> extends ArrayLike<T> {
        readonly length: number;
        [index: number]: T;
        
        // Traversing
        find<E = Element>(selector: string): Cheerio<E>;
        parent<E = Element>(selector?: string): Cheerio<E>;
        parents<E = Element>(selector?: string): Cheerio<E>;
        parentsUntil<E = Element>(selector?: string, filter?: string): Cheerio<E>;
        next<E = Element>(selector?: string): Cheerio<E>;
        nextAll<E = Element>(selector?: string): Cheerio<E>;
        nextUntil<E = Element>(selector?: string, filter?: string): Cheerio<E>;
        prev<E = Element>(selector?: string): Cheerio<E>;
        prevAll<E = Element>(selector?: string): Cheerio<E>;
        prevUntil<E = Element>(selector?: string, filter?: string): Cheerio<E>;
        siblings<E = Element>(selector?: string): Cheerio<E>;
        children<E = Element>(selector?: string): Cheerio<E>;
        contents<E = Element>(): Cheerio<E>;
        
        each(fn: (index: number, element: T) => void | boolean): this;
        map<R>(fn: (index: number, element: T) => R): Cheerio<R>;
        filter(selector: string | ((index: number, element: T) => boolean)): this;
        not(selector: string | ((index: number, element: T) => boolean)): this;
        has(selector: string): this;
        first(): this;
        last(): this;
        eq(index: number): this;
        get(): T[];
        get(index: number): T | undefined;
        index(): number;
        index(selector: string | Cheerio<Element>): number;
        slice(start: number, end?: number): this;
        
        // Attributes
        attr(name: string): string | undefined;
        attr(name: string, value: string | number | null): this;
        attr(attributes: Record<string, string | number | null>): this;
        removeAttr(name: string): this;
        hasClass(className: string): boolean;
        addClass(className: string | string[]): this;
        removeClass(className?: string | string[]): this;
        toggleClass(className: string, state?: boolean): this;
        
        // Properties
        prop(name: string): unknown;
        prop(name: string, value: unknown): this;
        data(name: string): unknown;
        data(name: string, value: unknown): this;
        val(): string | string[] | undefined;
        val(value: string | string[]): this;
        
        // Content
        text(): string;
        text(content: string): this;
        html(): string | null;
        html(content: string): this;
        
        // Manipulation
        append(content: string | Element | Cheerio<Element>): this;
        appendTo(target: string | Cheerio<Element>): this;
        prepend(content: string | Element | Cheerio<Element>): this;
        prependTo(target: string | Cheerio<Element>): this;
        after(content: string | Element | Cheerio<Element>): this;
        insertAfter(target: string | Cheerio<Element>): this;
        before(content: string | Element | Cheerio<Element>): this;
        insertBefore(target: string | Cheerio<Element>): this;
        remove(selector?: string): this;
        replaceWith(content: string | Element | Cheerio<Element>): this;
        empty(): this;
        wrap(content: string | Element | Cheerio<Element>): this;
        unwrap(): this;
        
        // CSS
        css(propertyName: string): string | undefined;
        css(propertyName: string, value: string | number): this;
        css(properties: Record<string, string | number>): this;
        
        // Dimensions
        width(): number | undefined;
        height(): number | undefined;
        
        // Forms
        serialize(): string;
        serializeArray(): Array<{ name: string; value: string }>;
        
        // Utilities
        is(selector: string): boolean;
        toArray(): T[];
        clone(): this;
    }
    
    interface Element {
        readonly type: string;
        readonly name?: string;
        readonly tagName?: string;
        readonly attribs?: Record<string, string>;
        readonly children?: Element[];
        readonly parent?: Element | null;
        readonly next?: Element | null;
        readonly prev?: Element | null;
        data?: string;
    }
    
    interface Document extends Element {
        readonly type: 'root';
    }
    
    interface CheerioOptions {
        xmlMode?: boolean;
        decodeEntities?: boolean;
        lowerCaseTags?: boolean;
        lowerCaseAttributeNames?: boolean;
        recognizeCDATA?: boolean;
        recognizeSelfClosing?: boolean;
        baseURI?: string;
    }
    
    function load(html: string | Buffer, options?: CheerioOptions): CheerioAPI;
    
    export = load;
}
