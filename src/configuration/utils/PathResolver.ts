/**
 * PathResolver - Utility for resolving and manipulating configuration paths
 */
export class PathResolver {
    private readonly separator: string;
    private readonly pathCache: Map<string, string[]>;

    constructor(separator: string = '.') {
        this.separator = separator;
        this.pathCache = new Map();
    }

    /**
     * Splits a path into parts (cached for performance)
     */
    public split(path: string): string[] {
        if (!path || path.length === 0) {
            return [];
        }

        // Check cache
        let parts = this.pathCache.get(path);
        if (parts) {
            return parts;
        }

        // Split and cache
        parts = path.split(this.separator);
        this.pathCache.set(path, parts);

        return parts;
    }

    /**
     * Joins path parts into a path string
     */
    public join(...parts: string[]): string {
        return parts.filter(p => p && p.length > 0).join(this.separator);
    }

    /**
     * Gets the parent path
     */
    public parent(path: string): string | null {
        const parts = this.split(path);
        if (parts.length <= 1) {
            return null;
        }
        return this.join(...parts.slice(0, -1));
    }

    /**
     * Gets the last part of a path (the key name)
     */
    public basename(path: string): string {
        const parts = this.split(path);
        return parts.length > 0 ? parts[parts.length - 1] : '';
    }

    /**
     * Checks if a path is a child of another path
     */
    public isChildOf(childPath: string, parentPath: string): boolean {
        if (!parentPath || parentPath.length === 0) {
            return true;
        }

        return childPath.startsWith(parentPath + this.separator);
    }

    /**
     * Gets the relative path from parent to child
     */
    public relative(from: string, to: string): string | null {
        if (!this.isChildOf(to, from)) {
            return null;
        }

        if (!from || from.length === 0) {
            return to;
        }

        return to.substring(from.length + this.separator.length);
    }

    /**
     * Normalizes a path (removes empty parts, trailing separators, etc.)
     */
    public normalize(path: string): string {
        const parts = this.split(path);
        return this.join(...parts.filter(p => p && p.length > 0));
    }

    /**
     * Resolves a relative path against a base path
     */
    public resolve(base: string, relative: string): string {
        if (!base || base.length === 0) {
            return relative;
        }
        return this.join(base, relative);
    }

    /**
     * Checks if a path matches a pattern
     * Supports wildcards: * (matches any characters), ** (matches any depth)
     */
    public matches(path: string, pattern: string): boolean {
        if (pattern === '**') {
            return true;
        }

        const pathParts = this.split(path);
        const patternParts = this.split(pattern);

        return this.matchesParts(pathParts, patternParts);
    }

    private matchesParts(pathParts: string[], patternParts: string[]): boolean {
        let pi = 0; // path index
        let pati = 0; // pattern index

        while (pi < pathParts.length && pati < patternParts.length) {
            const patPart = patternParts[pati];

            if (patPart === '**') {
                // ** matches zero or more path segments
                if (pati === patternParts.length - 1) {
                    return true; // ** at end matches everything
                }

                // Try matching rest of pattern at each remaining position
                for (let i = pi; i <= pathParts.length; i++) {
                    if (this.matchesParts(pathParts.slice(i), patternParts.slice(pati + 1))) {
                        return true;
                    }
                }
                return false;
            }

            if (patPart === '*') {
                // * matches exactly one segment with any content
                pi++;
                pati++;
                continue;
            }

            if (this.matchSegment(pathParts[pi], patPart)) {
                pi++;
                pati++;
            } else {
                return false;
            }
        }

        // Both should be exhausted for a match
        return pi === pathParts.length && pati === patternParts.length;
    }

    private matchSegment(segment: string, pattern: string): boolean {
        if (pattern === '*') {
            return true;
        }

        if (pattern.indexOf('*') === -1) {
            return segment === pattern;
        }

        // Convert glob pattern to regex
        const regex = new RegExp(
            '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
        );

        return regex.test(segment);
    }

    /**
     * Clears the path cache
     */
    public clearCache(): void {
        this.pathCache.clear();
    }
}
