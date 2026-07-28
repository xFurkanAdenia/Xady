import { Configuration, ConfigurationSection, ConfigurationOptions } from './Configuration';
import { MemorySection } from './MemorySection';
import { MemoryConfigurationOptions } from './MemoryConfigurationOptions';

/**
 * MemoryConfiguration - In-memory implementation of Configuration
 * Mirrors Bukkit's MemoryConfiguration class
 */
export class MemoryConfiguration extends MemorySection implements Configuration {
    protected _options: MemoryConfigurationOptions;
    protected _defaults: Configuration | null;

    constructor() {
        super();
        this._options = new MemoryConfigurationOptions(this);
        this._defaults = null;
    }

    addDefaults(defaults: Configuration): void {
        if (!defaults) {
            throw new Error('Defaults cannot be null');
        }

        const keys = (defaults as any).getKeys(true);
        for (const key of keys) {
            const value = (defaults as any).get(key);
            if (value !== null && !this.contains(key)) {
                this.defaults.set(key, value);
            }
        }
    }

    addDefaultsFromMap(defaults: Record<string, any>): void {
        if (!defaults) {
            throw new Error('Defaults cannot be null');
        }

        this.addDefaultsRecursive(defaults, '');
    }

    private addDefaultsRecursive(data: Record<string, any>, prefix: string): void {
        for (const [key, value] of Object.entries(data)) {
            const path = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.addDefaultsRecursive(value, path);
            } else if (!this.contains(path)) {
                this.defaults.set(path, value);
            }
        }
    }

    setDefaults(defaults: Configuration | null): void {
        if (defaults === this) {
            throw new Error('Cannot set defaults to itself');
        }
        this._defaults = defaults;
    }

    getDefaults(): Configuration | null {
        return this._defaults;
    }

    getParent(): ConfigurationSection | null {
        return null;
    }

    options(): ConfigurationOptions {
        return this._options;
    }

    addDefault(path: string, value: any): void {
        if (!path || path.length === 0) {
            throw new Error('Path cannot be empty');
        }
        this.defaults.set(path, value);
    }

    getDefault(path: string): any {
        if (this._defaults) {
            return (this._defaults as any).get(path);
        }
        return super.getDefault(path);
    }

    /**
     * Creates a copy of this configuration
     */
    public clone(): MemoryConfiguration {
        const cloned = new MemoryConfiguration();
        cloned.fromObject(this.toObject());

        if (this._defaults) {
            const clonedDefaults = new MemoryConfiguration();
            clonedDefaults.fromObject((this._defaults as any).toObject());
            cloned.setDefaults(clonedDefaults);
        }

        return cloned;
    }

    /**
     * Merges another configuration into this one
     */
    public merge(other: Configuration): void {
        const keys = (other as any).getKeys(true);
        for (const key of keys) {
            if (!this.contains(key)) {
                this.set(key, (other as any).get(key));
            }
        }
    }
}
