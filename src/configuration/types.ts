/**
 * Type definitions for Configuration system
 */

/**
 * Deep path type - generates all possible paths in a nested object
 * 
 * @example
 * ```typescript
 * interface Config {
 *   database: {
 *     host: string;
 *     port: number;
 *   }
 * }
 * 
 * type Paths = ConfigPath<Config>;
 * // "database" | "database.host" | "database.port"
 * ```
 */
export type ConfigPath<T, Prefix extends string = ''> = T extends object
    ? {
          [K in keyof T]: K extends string
              ? T[K] extends object
                  ? `${Prefix}${K}` | ConfigPath<T[K], `${Prefix}${K}.`>
                  : `${Prefix}${K}`
              : never;
      }[keyof T]
    : never;

/**
 * Get value type at a config path
 * 
 * @example
 * ```typescript
 * type HostType = ConfigValue<Config, "database.host">; // string
 * type PortType = ConfigValue<Config, "database.port">; // number
 * ```
 */
export type ConfigValue<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
        ? ConfigValue<T[Key], Rest>
        : never
    : Path extends keyof T
    ? T[Path]
    : never;

/**
 * Typed configuration wrapper (simplified to avoid deep type recursion)
 * 
 * @example
 * ```typescript
 * interface MyConfig {
 *   database: {
 *     host: string;
 *     port: number;
 *   };
 * }
 * 
 * const config: TypedConfiguration<MyConfig> = new YamlConfiguration();
 * ```
 */
export interface TypedConfiguration<T extends Record<string, any>> {
    get(path: string): any | null;
    set(path: string, value: any): void;
    getString(path: string): string | null;
    getInt(path: string): number | null;
    getBoolean(path: string): boolean | null;
    getDouble(path: string): number | null;
}

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
    path: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
}

/**
 * Configuration listener
 */
export interface ConfigurationListener {
    onLoad?(): void;
    onSave?(): void;
    onReload?(): void;
    onBeforeSave?(): void;
    onAfterSave?(): void;
    onChange?(event: ConfigurationChangeEvent): void;
}

/**
 * Migration handler
 */
export interface ConfigurationMigration {
    /**
     * Version this migration upgrades from
     */
    fromVersion: number;

    /**
     * Version this migration upgrades to
     */
    toVersion: number;

    /**
     * Performs the migration
     */
    migrate(config: any): void;

    /**
     * Optional description
     */
    description?: string;
}
