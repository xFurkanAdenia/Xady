/**
 * ConfigurationSerializable - Interface for objects that can be serialized to/from configuration
 * Mirrors Bukkit's ConfigurationSerializable
 */
export interface ConfigurationSerializable {
    /**
     * Serializes this object to a map
     */
    serialize(): Record<string, any>;
}

/**
 * SerializableConstructor - Type for constructors that can deserialize
 */
export interface SerializableConstructor<T extends ConfigurationSerializable> {
    new(data: Record<string, any>): T;
    deserialize?(data: Record<string, any>): T;
}

/**
 * ConfigurationSerialization - Registry for serializable classes
 * Mirrors Bukkit's ConfigurationSerialization
 */
export class ConfigurationSerialization {
    private static readonly registry = new Map<string, SerializableConstructor<any>>();
    private static readonly aliases = new Map<string, string>();

    /**
     * Registers a class for serialization
     */
    public static registerClass<T extends ConfigurationSerializable>(
        clazz: SerializableConstructor<T>,
        alias?: string
    ): void {
        const name = clazz.name;
        
        if (!name || name.length === 0) {
            throw new Error('Cannot register anonymous class');
        }

        ConfigurationSerialization.registry.set(name, clazz);

        if (alias) {
            ConfigurationSerialization.aliases.set(alias, name);
        }
    }

    /**
     * Unregisters a class
     */
    public static unregisterClass(clazz: SerializableConstructor<any>): void {
        const name = clazz.name;
        ConfigurationSerialization.registry.delete(name);

        // Remove aliases
        for (const [alias, className] of ConfigurationSerialization.aliases) {
            if (className === name) {
                ConfigurationSerialization.aliases.delete(alias);
            }
        }
    }

    /**
     * Gets a registered class by name or alias
     */
    public static getClass(name: string): SerializableConstructor<any> | undefined {
        // Try direct lookup
        let clazz = ConfigurationSerialization.registry.get(name);
        if (clazz) return clazz;

        // Try alias lookup
        const className = ConfigurationSerialization.aliases.get(name);
        if (className) {
            return ConfigurationSerialization.registry.get(className);
        }

        return undefined;
    }

    /**
     * Serializes an object
     */
    public static serialize(obj: ConfigurationSerializable): Record<string, any> {
        const data = obj.serialize();
        
        // Add class identifier
        data['=='] = obj.constructor.name;
        
        return data;
    }

    /**
     * Deserializes an object from data
     */
    public static deserialize(data: Record<string, any>): ConfigurationSerializable | null {
        if (!data || typeof data !== 'object') {
            return null;
        }

        const className = data['=='];
        if (!className) {
            return null;
        }

        const clazz = ConfigurationSerialization.getClass(className);
        if (!clazz) {
            throw new Error(`No class registered for ${className}`);
        }

        // Remove class identifier from data
        const cleanData = { ...data };
        delete cleanData['=='];

        // Try static deserialize method first
        if ('deserialize' in clazz && typeof clazz.deserialize === 'function') {
            return clazz.deserialize(cleanData);
        }

        // Fall back to constructor
        return new clazz(cleanData);
    }

    /**
     * Deserializes from a map that may contain serializable objects
     */
    public static deserializeMap(data: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null && '==' in value) {
                result[key] = ConfigurationSerialization.deserialize(value);
            } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                result[key] = ConfigurationSerialization.deserializeMap(value);
            } else if (Array.isArray(value)) {
                result[key] = ConfigurationSerialization.deserializeList(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Deserializes from a list that may contain serializable objects
     */
    public static deserializeList(list: any[]): any[] {
        return list.map(item => {
            if (typeof item === 'object' && item !== null && '==' in item) {
                return ConfigurationSerialization.deserialize(item);
            } else if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
                return ConfigurationSerialization.deserializeMap(item);
            } else if (Array.isArray(item)) {
                return ConfigurationSerialization.deserializeList(item);
            }
            return item;
        });
    }

    /**
     * Checks if an object is serializable
     */
    public static isSerializable(obj: any): obj is ConfigurationSerializable {
        return obj && typeof obj === 'object' && 'serialize' in obj;
    }

    /**
     * Checks if data contains a serialized object
     */
    public static isSerialized(data: any): boolean {
        return data && typeof data === 'object' && '==' in data;
    }

    /**
     * Gets all registered class names
     */
    public static getRegisteredClasses(): string[] {
        return Array.from(ConfigurationSerialization.registry.keys());
    }

    /**
     * Gets all registered aliases
     */
    public static getRegisteredAliases(): Map<string, string> {
        return new Map(ConfigurationSerialization.aliases);
    }
}
