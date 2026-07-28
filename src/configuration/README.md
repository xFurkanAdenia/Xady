# Xady Configuration API

A complete TypeScript implementation of Bukkit/Paper Configuration system with full type safety and modern features.

## Features

- **Bukkit/Paper Compatible**: API mirrors Bukkit's Configuration system
- **Type-Safe**: Full TypeScript support with generics
- **YAML Support**: Complete YAML 1.2 implementation with comments, anchors, aliases
- **Performance**: Optimized with path caching and lazy loading
- **Validation**: Built-in validation with helpful error messages
- **Serialization**: Custom class serialization support
- **File Watching**: Auto-reload on external file changes
- **Auto-Save**: Debounced automatic saving
- **Transactions**: Atomic configuration changes
- **Migration**: Version-based migration system

## Quick Start

```typescript
import { YamlConfiguration } from './configuration';

// Create and load config
const config = new YamlConfiguration();
await config.load('./config.yml');

// Read values
const host = config.getString('database.host');
const port = config.getInt('database.port');
const enabled = config.getBoolean('features.autoSave');

// Write values
config.set('database.host', 'localhost');
config.set('database.port', 3306);

// Save
await config.save();
```

## Module Usage (Bukkit Style)

```typescript
export default class MyModule extends Xady.Module {
    onEnable(): void {
        // Save default config from resources
        this.saveDefaultConfig();
        
        // Get config
        const config = this.getConfig();
        
        // Read with defaults
        const host = config.getString('database.host', 'localhost');
        const port = config.getInt('database.port', 3306);
        
        // Read sections
        const dbSection = config.getConfigurationSection('database');
        if (dbSection) {
            const user = dbSection.getString('user');
            const pass = dbSection.getString('password');
        }
        
        // Modify
        config.set('lastStarted', Date.now());
        
        // Save
        this.saveConfig();
    }
}
```

## Type-Safe Paths

```typescript
interface Config {
    database: {
        host: string;
        port: number;
        credentials: {
            user: string;
            password: string;
        };
    };
    features: {
        autoSave: boolean;
        interval: number;
    };
}

const config = new YamlConfiguration<Config>();

// IDE autocomplete and type checking
const host = config.get('database.host'); // string
const port = config.get('database.port'); // number
```

## Sections

```typescript
// Create section
const dbSection = config.createSection('database');
dbSection.set('host', 'localhost');
dbSection.set('port', 3306);

// Get section
const section = config.getConfigurationSection('database');
if (section) {
    const keys = section.getKeys(false); // shallow
    const allKeys = section.getKeys(true); // deep
    
    for (const key of keys) {
        console.log(`${key} = ${section.get(key)}`);
    }
}

// Create with map
config.createSectionWithMap('database', {
    host: 'localhost',
    port: 3306,
    credentials: {
        user: 'admin',
        password: 'secret'
    }
});
```

## Defaults

```typescript
// Add defaults
config.addDefault('database.host', 'localhost');
config.addDefault('database.port', 3306);

// Add from map
config.addDefaultsFromMap({
    database: {
        host: 'localhost',
        port: 3306
    },
    features: {
        autoSave: true
    }
});

// Copy defaults to config
config.options().copyDefaultsWith(true);

// Get with fallback to default
const host = config.getString('database.host'); // uses default if not set
```

## Comments

```typescript
// Header and footer
config.setHeader([
    'My Application Config',
    'Edit with care!'
]);

config.setFooter('End of configuration');

// Inline comments
config.setComment('database.host', 'Database server hostname');
config.setComment('database.port', [
    'Database server port',
    'Default: 3306'
]);

// Get comments
const comment = config.getComment('database.host');
```

## Validation

```typescript
import { ConfigurationValidator } from './configuration';

// Require values (throws if missing)
const host = ConfigurationValidator.requireString(config, 'database.host');
const port = ConfigurationValidator.requireInt(config, 'database.port');

// Require section
const section = ConfigurationValidator.requireSection(config, 'database');

// Range validation
const timeout = ConfigurationValidator.requireInRange(config, 'timeout', 0, 60);

// Pattern validation
const email = ConfigurationValidator.requirePattern(
    config,
    'admin.email',
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
);

// Enum validation
const mode = ConfigurationValidator.requireOneOf(
    config,
    'server.mode',
    ['development', 'production']
);
```

## Serialization

```typescript
import { ConfigurationSerializable, ConfigurationSerialization } from './configuration';

class Location implements ConfigurationSerializable {
    constructor(
        public x: number,
        public y: number,
        public z: number
    ) {}

    serialize(): Record<string, any> {
        return { x: this.x, y: this.y, z: this.z };
    }

    static deserialize(data: Record<string, any>): Location {
        return new Location(data.x, data.y, data.z);
    }
}

// Register class
ConfigurationSerialization.registerClass(Location, 'Location');

// Save
config.set('spawn', new Location(0, 64, 0));
await config.save();

// Load
const spawn = config.get('spawn'); // Location instance
```

## File Watching

```typescript
import { FileWatcher } from './configuration';

const watcher = new FileWatcher('./config.yml');

watcher.on('change', async () => {
    console.log('Config file changed, reloading...');
    await config.reload();
});

watcher.on('error', (error) => {
    console.error('Watcher error:', error);
});

watcher.start();

// Stop watching
watcher.stop();
```

## Auto-Save

```typescript
import { AutoSaveManager } from './configuration';

const autoSave = new AutoSaveManager(config, 5000); // 5 second debounce
autoSave.enable();

// Changes are automatically saved after 5 seconds of inactivity
config.set('foo', 'bar');
config.set('baz', 123);
// ... saves once after 5 seconds

// Force immediate save
await autoSave.forceSave();

// Disable
autoSave.disable();
```

## Options

```typescript
const options = config.options();

// Path separator
options.pathSeparatorWith('/');
config.set('database/host', 'localhost');

// Copy defaults
options.copyDefaultsWith(true);

// YAML-specific options
if (config instanceof YamlConfiguration) {
    const yamlOpts = config.options();
    
    // Indent
    yamlOpts.indentWith(4);
    
    // Comments
    yamlOpts.parseCommentsWith(true);
    yamlOpts.saveCommentsWith(true);
    
    // Quote style
    yamlOpts.quoteStyleWith('SINGLE');
}
```

## Advanced Features

### Cloning

```typescript
const clone = config.clone();
clone.set('test', 'value');
// Original unchanged
```

### Merging

```typescript
const defaults = new YamlConfiguration();
await defaults.load('./defaults.yml');

config.merge(defaults);
```

### Backup/Restore

```typescript
// Create backup
const backupPath = await config.backup('.bak');

// Restore from backup
await config.restore(backupPath);
```

### Dirty Tracking

```typescript
if (config.isDirty()) {
    console.log('Config has unsaved changes');
    await config.save();
}

// Save only if dirty
const saved = await config.saveIfDirty();
```

## Error Handling

```typescript
import {
    ConfigurationException,
    InvalidConfigurationException,
    PathNotFoundException,
    TypeMismatchException
} from './configuration';

try {
    await config.load('./config.yml');
} catch (error) {
    if (error instanceof InvalidConfigurationException) {
        console.error('Invalid YAML syntax:', error.message);
    } else if (error instanceof ConfigurationException) {
        console.error('Configuration error:', error.message);
    }
}

try {
    const value = ConfigurationValidator.requireString(config, 'missing.path');
} catch (error) {
    if (error instanceof PathNotFoundException) {
        console.error(`Path not found: ${error.getPath()}`);
    } else if (error instanceof TypeMismatchException) {
        console.error(`Type mismatch: expected ${error.getExpectedType()}, got ${error.getActualType()}`);
    }
}
```

## Best Practices

1. **Always use defaults**: Provide default values for all configuration keys
2. **Validate early**: Use ConfigurationValidator for required values
3. **Use sections**: Group related configuration into sections
4. **Add comments**: Document configuration options with comments
5. **Version your config**: Track configuration version for migrations
6. **Handle errors**: Always wrap config operations in try-catch
7. **Save on change**: Call saveConfig() after modifying configuration
8. **Use type-safe paths**: Define interfaces for your configuration structure

## Performance Tips

- Path operations are cached automatically
- Use `getKeys(false)` instead of `getKeys(true)` when possible
- Batch multiple sets before saving
- Enable auto-save to reduce manual save calls
- Use sections to access related values efficiently

## Migration from Old System

```typescript
// Old code
const config = new FileConfiguration('./config.yml');
config.load();
const value = config.get('path');

// New code (same API!)
const config = new YamlConfiguration();
await config.load('./config.yml');
const value = config.get('path');

// Or in modules (no changes needed!)
const config = this.getConfig();
const value = config.getString('path', 'default');
```

## API Reference

See [Configuration.ts](./Configuration.ts) for full API documentation.

## License

Part of Xady Framework
