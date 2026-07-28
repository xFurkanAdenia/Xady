import { Configuration, ConfigurationSection } from './Configuration';

/**
 * MemorySection - In-memory implementation of ConfigurationSection
 * Mirrors Bukkit's MemorySection class
 */
export class MemorySection implements ConfigurationSection {
    protected readonly map: Map<string, any>;
    protected readonly defaults: Map<string, any>;
    protected readonly parent: ConfigurationSection | null;
    protected readonly path: string;
    protected readonly root: Configuration;

    constructor(
        parent: ConfigurationSection | null = null,
        path: string = '',
        root?: Configuration
    ) {
        this.map = new Map();
        this.defaults = new Map();
        this.parent = parent;
        this.path = path;
        this.root = root || (this as any as Configuration);
    }

    getKeys(deep: boolean): Set<string> {
        const keys = new Set<string>();

        for (const [key] of this.map) {
            keys.add(this.createPath(key, this.path));

            if (deep) {
                const value = this.map.get(key);
                if (value instanceof MemorySection) {
                    for (const subKey of value.getKeys(true)) {
                        keys.add(this.createPath(key + '.' + subKey, this.path));
                    }
                }
            }
        }

        return keys;
    }

    getValues(deep: boolean): Map<string, any> {
        const result = new Map<string, any>();

        for (const [key, value] of this.map) {
            const fullKey = this.createPath(key, this.path);

            if (value instanceof MemorySection) {
                if (deep) {
                    const subValues = value.getValues(true);
                    for (const [subKey, subValue] of subValues) {
                        result.set(this.createPath(key + '.' + subKey, this.path), subValue);
                    }
                } else {
                    result.set(fullKey, value);
                }
            } else {
                result.set(fullKey, value);
            }
        }

        return result;
    }

    contains(path: string): boolean {
        return this.containsIgnoreDefault(path, false);
    }

    containsIgnoreDefault(path: string, ignoreDefault: boolean): boolean {
        if (!path || path.length === 0) return false;

        const def = this.getDefault(path);
        if (def !== null && !ignoreDefault) {
            return true;
        }

        return this.get(path) !== null;
    }

    isSet(path: string): boolean {
        return this.get(path) !== null;
    }

    getCurrentPath(): string {
        return this.path;
    }

    getName(): string {
        if (!this.path || this.path.length === 0) return '';
        const parts = this.path.split('.');
        return parts[parts.length - 1];
    }

    getRoot(): Configuration | null {
        return this.root;
    }

    getParent(): ConfigurationSection | null {
        return this.parent;
    }

    get(path: string): any {
        if (!path || path.length === 0) return this;

        const parts = this.parsePath(path);
        let section: ConfigurationSection = this;

        for (let i = 0; i < parts.length - 1; i++) {
            const child = section.getConfigurationSection(parts[i]);
            if (!child) {
                const copyDefaults = this.root?.options?.()?.copyDefaults?.() ?? false;
                if (copyDefaults) {
                    return this.getDefault(path);
                }
                return null;
            }
            section = child;
        }

        const key = parts[parts.length - 1];
        if (section === this) {
            const value = this.map.get(key);
            if (value !== undefined) {
                return value;
            }
            const copyDefaults = this.root?.options?.()?.copyDefaults?.() ?? false;
            if (copyDefaults) {
                const def = this.getDefault(path);
                if (def !== null) {
                    return def;
                }
            }
            return null;
        }

        return section.get(key);
    }

    getWithDefault(path: string, def: any): any {
        const value = this.get(path);
        return value !== null ? value : def;
    }

    set(path: string, value: any): void {
        if (!path || path.length === 0) {
            throw new Error('Cannot set value to empty path');
        }

        const parts = this.parsePath(path);
        let section: MemorySection = this;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            let child = section.map.get(part);

            if (!(child instanceof MemorySection)) {
                child = new MemorySection(section, this.createPath(part, section.path), this.root);
                section.map.set(part, child);
            }

            section = child;
        }

        const key = parts[parts.length - 1];

        if (value === null || value === undefined) {
            section.map.delete(key);
        } else {
            section.map.set(key, value);
        }
    }

    createSection(path: string): ConfigurationSection {
        if (!path || path.length === 0) {
            throw new Error('Cannot create section at empty path');
        }

        const parts = this.parsePath(path);
        let section: MemorySection = this;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            let child = section.map.get(part);

            if (!(child instanceof MemorySection)) {
                child = new MemorySection(section, this.createPath(part, section.path), this.root);
                section.map.set(part, child);
            }

            section = child;
        }

        return section;
    }

    createSectionWithMap(path: string, map: Record<string, any>): ConfigurationSection {
        const section = this.createSection(path);

        for (const [key, value] of Object.entries(map)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                section.createSectionWithMap(key, value);
            } else {
                section.set(key, value);
            }
        }

        return section;
    }

    getConfigurationSection(path: string): ConfigurationSection | null {
        const value = this.get(path);
        return value instanceof MemorySection ? value : null;
    }

    isConfigurationSection(path: string): boolean {
        return this.get(path) instanceof MemorySection;
    }

    getDefault(path: string): any {
        const fullPath = this.createPath(path, this.path);
        const directValue = this.defaults.get(fullPath);
        if (directValue !== undefined) {
            return directValue;
        }

        const root = this.getRoot();
        const defaults = root ? (root as any).getDefaults() : null;

        if (!defaults) return null;

        return (defaults as any).get(fullPath);
    }

    addDefault(path: string, value: any): void {
        const root = this.getRoot();
        if (root) {
            (root as any).addDefault(this.createPath(path, this.path), value);
        }
    }

    // Type-safe getters
    getString(path: string): string | null {
        const value = this.get(path);
        return value !== null ? String(value) : null;
    }

    getStringOrDefault(path: string, def: string): string {
        const value = this.getString(path);
        return value !== null ? value : def;
    }

    isString(path: string): boolean {
        const value = this.get(path);
        return typeof value === 'string';
    }

    getInt(path: string): number | null {
        const value = this.get(path);
        if (value === null) return null;
        const parsed = parseInt(String(value), 10);
        return isNaN(parsed) ? null : parsed;
    }

    getIntOrDefault(path: string, def: number): number {
        const value = this.getInt(path);
        return value !== null ? value : def;
    }

    isInt(path: string): boolean {
        const value = this.get(path);
        if (typeof value === 'number') return Number.isInteger(value);
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return !isNaN(parsed) && String(parsed) === value;
        }
        return false;
    }

    getBoolean(path: string): boolean | null {
        const value = this.get(path);
        if (value === null) return null;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const lower = value.toLowerCase();
            if (lower === 'true') return true;
            if (lower === 'false') return false;
        }
        return Boolean(value);
    }

    getBooleanOrDefault(path: string, def: boolean): boolean {
        const value = this.getBoolean(path);
        return value !== null ? value : def;
    }

    isBoolean(path: string): boolean {
        const value = this.get(path);
        return typeof value === 'boolean';
    }

    getDouble(path: string): number | null {
        const value = this.get(path);
        if (value === null) return null;
        const parsed = parseFloat(String(value));
        return isNaN(parsed) ? null : parsed;
    }

    getDoubleOrDefault(path: string, def: number): number {
        const value = this.getDouble(path);
        return value !== null ? value : def;
    }

    isDouble(path: string): boolean {
        return this.isNumber(path);
    }

    getLong(path: string): bigint | null {
        const value = this.get(path);
        if (value === null) return null;
        try {
            return BigInt(value);
        } catch {
            return null;
        }
    }

    getLongOrDefault(path: string, def: bigint): bigint {
        const value = this.getLong(path);
        return value !== null ? value : def;
    }

    isLong(path: string): boolean {
        const value = this.get(path);
        if (typeof value === 'bigint') return true;
        try {
            BigInt(value);
            return true;
        } catch {
            return false;
        }
    }

    getFloat(path: string): number | null {
        return this.getDouble(path);
    }

    getFloatOrDefault(path: string, def: number): number {
        return this.getDoubleOrDefault(path, def);
    }

    isFloat(path: string): boolean {
        return this.isNumber(path);
    }

    getShort(path: string): number | null {
        const value = this.getInt(path);
        if (value === null) return null;
        return value >= -32768 && value <= 32767 ? value : null;
    }

    getShortOrDefault(path: string, def: number): number {
        const value = this.getShort(path);
        return value !== null ? value : def;
    }

    isShort(path: string): boolean {
        const value = this.getInt(path);
        return value !== null && value >= -32768 && value <= 32767;
    }

    getByte(path: string): number | null {
        const value = this.getInt(path);
        if (value === null) return null;
        return value >= -128 && value <= 127 ? value : null;
    }

    getByteOrDefault(path: string, def: number): number {
        const value = this.getByte(path);
        return value !== null ? value : def;
    }

    isByte(path: string): boolean {
        const value = this.getInt(path);
        return value !== null && value >= -128 && value <= 127;
    }

    getChar(path: string): string | null {
        const value = this.getString(path);
        return value !== null && value.length === 1 ? value : null;
    }

    getCharOrDefault(path: string, def: string): string {
        const value = this.getChar(path);
        return value !== null ? value : def;
    }

    isChar(path: string): boolean {
        const value = this.get(path);
        return typeof value === 'string' && value.length === 1;
    }

    getList(path: string): any[] | null {
        const value = this.get(path);
        return Array.isArray(value) ? value : null;
    }

    getListOrDefault(path: string, def: any[]): any[] {
        const value = this.getList(path);
        return value !== null ? value : def;
    }

    isList(path: string): boolean {
        return Array.isArray(this.get(path));
    }

    getStringList(path: string): string[] {
        const list = this.getList(path);
        return list ? list.map(v => String(v)) : [];
    }

    getIntegerList(path: string): number[] {
        const list = this.getList(path);
        return list ? list.map(v => parseInt(String(v), 10)).filter(v => !isNaN(v)) : [];
    }

    getLongList(path: string): bigint[] {
        const list = this.getList(path);
        return list ? list.map(v => {
            try { return BigInt(v); } catch { return null; }
        }).filter(v => v !== null) as bigint[] : [];
    }

    getFloatList(path: string): number[] {
        const list = this.getList(path);
        return list ? list.map(v => parseFloat(String(v))).filter(v => !isNaN(v)) : [];
    }

    getDoubleList(path: string): number[] {
        return this.getFloatList(path);
    }

    getBooleanList(path: string): boolean[] {
        const list = this.getList(path);
        return list ? list.map(v => Boolean(v)) : [];
    }

    getCharacterList(path: string): string[] {
        const list = this.getStringList(path);
        return list.filter(v => v.length === 1);
    }

    getByteList(path: string): number[] {
        const list = this.getIntegerList(path);
        return list.filter(v => v >= -128 && v <= 127);
    }

    getShortList(path: string): number[] {
        const list = this.getIntegerList(path);
        return list.filter(v => v >= -32768 && v <= 32767);
    }

    getMapList(path: string): Record<string, any>[] {
        const list = this.getList(path);
        return list ? list.filter(v => typeof v === 'object' && v !== null && !Array.isArray(v)) : [];
    }

    isNumber(path: string): boolean {
        const value = this.get(path);
        return typeof value === 'number' && !isNaN(value);
    }

    isMap(path: string): boolean {
        const value = this.get(path);
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    // Helper methods
    protected parsePath(path: string): string[] {
        const root = this.getRoot();
        const separator = root ? (root as any).options().pathSeparator() : '.';
        return path.split(separator);
    }

    protected createPath(path: string, relativeTo: string): string {
        const root = this.getRoot();
        const separator = root ? (root as any).options().pathSeparator() : '.';

        if (!relativeTo || relativeTo.length === 0) {
            return path;
        }

        return relativeTo + separator + path;
    }

    /**
     * Converts this section to a plain object
     */
    public toObject(): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, value] of this.map) {
            if (value instanceof MemorySection) {
                result[key] = value.toObject();
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Loads data from a plain object
     */
    public fromObject(data: Record<string, any>): void {
        this.map.clear();

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const section = new MemorySection(this, this.createPath(key, this.path), this.root);
                section.fromObject(value);
                this.map.set(key, section);
            } else {
                this.map.set(key, value);
            }
        }
    }
}
