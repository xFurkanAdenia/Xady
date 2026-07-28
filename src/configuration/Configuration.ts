/**
 * Base Configuration interface - mirrors Bukkit Configuration API
 * Represents any configuration that can store values at paths
 */
export interface Configuration {
    /**
     * Gets the parent Configuration section
     */
    getParent(): ConfigurationSection | null;

    /**
     * Adds defaults to this configuration
     */
    addDefaults(defaults: Configuration): void;

    /**
     * Adds defaults from a map
     */
    addDefaultsFromMap(defaults: Record<string, any>): void;

    /**
     * Sets the default Configuration section
     */
    setDefaults(defaults: Configuration | null): void;

    /**
     * Gets the default Configuration section
     */
    getDefaults(): Configuration | null;

    /**
     * Gets the ConfigurationOptions for this configuration
     */
    options(): ConfigurationOptions;
}

/**
 * ConfigurationSection - mirrors Bukkit ConfigurationSection
 * Represents a section of a Configuration
 */
export interface ConfigurationSection {
    /**
     * Gets a set containing all keys in this section
     * @param deep Whether to get a deep list (recursive)
     */
    getKeys(deep: boolean): Set<string>;

    /**
     * Gets a Map containing all keys and values in this section
     * @param deep Whether to get deep values
     */
    getValues(deep: boolean): Map<string, any>;

    /**
     * Checks if this section contains the given path
     * @param path Path to check
     */
    contains(path: string): boolean;

    /**
     * Checks if this section contains the given path
     * @param path Path to check
     * @param ignoreDefault Whether to ignore default values
     */
    containsIgnoreDefault(path: string, ignoreDefault: boolean): boolean;

    /**
     * Checks if the specified path is set
     */
    isSet(path: string): boolean;

    /**
     * Gets the path of this section
     */
    getCurrentPath(): string;

    /**
     * Gets the name of this section
     */
    getName(): string;

    /**
     * Gets the root Configuration
     */
    getRoot(): Configuration | null;

    /**
     * Gets the parent ConfigurationSection
     */
    getParent(): ConfigurationSection | null;

    /**
     * Gets requested value at path
     */
    get(path: string): any;

    /**
     * Gets requested value at path with default
     */
    getWithDefault(path: string, def: any): any;

    /**
     * Sets value at path
     */
    set(path: string, value: any): void;

    /**
     * Creates a ConfigurationSection at path
     */
    createSection(path: string): ConfigurationSection;

    /**
     * Creates a ConfigurationSection at path with values
     */
    createSectionWithMap(path: string, map: Record<string, any>): ConfigurationSection;

    /**
     * Gets ConfigurationSection at path
     */
    getConfigurationSection(path: string): ConfigurationSection | null;

    /**
     * Checks if path is a ConfigurationSection
     */
    isConfigurationSection(path: string): boolean;

    /**
     * Gets default value at path
     */
    getDefault(path: string): any;

    /**
     * Adds default value at path
     */
    addDefault(path: string, value: any): void;

    // Type-safe getters
    getString(path: string): string | null;
    getStringOrDefault(path: string, def: string): string;
    
    isString(path: string): boolean;

    getInt(path: string): number | null;
    getIntOrDefault(path: string, def: number): number;
    
    isInt(path: string): boolean;

    getBoolean(path: string): boolean | null;
    getBooleanOrDefault(path: string, def: boolean): boolean;
    
    isBoolean(path: string): boolean;

    getDouble(path: string): number | null;
    getDoubleOrDefault(path: string, def: number): number;
    
    isDouble(path: string): boolean;

    getLong(path: string): bigint | null;
    getLongOrDefault(path: string, def: bigint): bigint;
    
    isLong(path: string): boolean;

    getFloat(path: string): number | null;
    getFloatOrDefault(path: string, def: number): number;
    
    isFloat(path: string): boolean;

    getShort(path: string): number | null;
    getShortOrDefault(path: string, def: number): number;
    
    isShort(path: string): boolean;

    getByte(path: string): number | null;
    getByteOrDefault(path: string, def: number): number;
    
    isByte(path: string): boolean;

    getChar(path: string): string | null;
    getCharOrDefault(path: string, def: string): string;
    
    isChar(path: string): boolean;

    getList(path: string): any[] | null;
    getListOrDefault(path: string, def: any[]): any[];
    
    isList(path: string): boolean;

    getStringList(path: string): string[];
    getIntegerList(path: string): number[];
    getLongList(path: string): bigint[];
    getFloatList(path: string): number[];
    getDoubleList(path: string): number[];
    getBooleanList(path: string): boolean[];
    getCharacterList(path: string): string[];
    getByteList(path: string): number[];
    getShortList(path: string): number[];
    getMapList(path: string): Record<string, any>[];

    isNumber(path: string): boolean;
    isMap(path: string): boolean;
}

/**
 * ConfigurationOptions - mirrors Bukkit ConfigurationOptions
 */
export interface ConfigurationOptions {
    /**
     * Gets the Configuration this options is for
     */
    configuration(): Configuration;

    /**
     * Gets the path separator character
     */
    pathSeparator(): string;

    /**
     * Sets the path separator
     */
    pathSeparatorWith(separator: string): ConfigurationOptions;

    /**
     * Checks if defaults should be copied
     */
    copyDefaults(): boolean;

    /**
     * Sets whether defaults should be copied
     */
    copyDefaultsWith(copy: boolean): ConfigurationOptions;
}
