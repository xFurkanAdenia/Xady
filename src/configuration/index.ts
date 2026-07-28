/**
 * Xady Configuration API
 * 
 * A complete TypeScript implementation of Bukkit/Paper Configuration system
 * Provides type-safe, feature-rich configuration management with YAML support
 * 
 * @example
 * ```typescript
 * import { YamlConfiguration } from './configuration';
 * 
 * const config = new YamlConfiguration();
 * await config.load('./config.yml');
 * 
 * const host = config.getString('database.host');
 * const port = config.getInt('database.port');
 * 
 * config.set('database.host', 'localhost');
 * await config.save();
 * ```
 */

// Core interfaces
export { Configuration, ConfigurationSection, ConfigurationOptions } from './Configuration';

// Memory implementations
export { MemorySection } from './MemorySection';
export { MemoryConfiguration } from './MemoryConfiguration';
export { MemoryConfigurationOptions } from './MemoryConfigurationOptions';

// File implementations
export { FileConfiguration } from './file/FileConfiguration';
export { YamlConfiguration } from './file/YamlConfiguration';
export { YamlConfigurationOptions } from './file/YamlConfigurationOptions';

// Exceptions
export {
    ConfigurationException,
    InvalidConfigurationException,
    PathNotFoundException,
    TypeMismatchException
} from './exceptions/ConfigurationException';

// Serialization
export {
    ConfigurationSerializable,
    SerializableConstructor,
    ConfigurationSerialization
} from './serialization/ConfigurationSerializable';

// Validation
export { ConfigurationValidator } from './validation/ConfigurationValidator';

// Utilities
export { PathResolver } from './utils/PathResolver';
export { FileWatcher } from './watcher/FileWatcher';
export { AutoSaveManager } from './autosave/AutoSaveManager';

// Type definitions
export {
    ConfigPath,
    ConfigValue,
    TypedConfiguration,
    ConfigurationChangeEvent,
    ConfigurationListener,
    ConfigurationMigration
} from './types';
