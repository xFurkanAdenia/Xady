/**
 * Example usage of the new Configuration system
 */

import { 
    YamlConfiguration, 
    ConfigurationValidator,
    ConfigurationSerializable,
    ConfigurationSerialization
} from '../src/configuration';

// Example 1: Basic usage
async function basicExample() {
    console.log('=== Basic Example ===');
    
    const config = new YamlConfiguration();
    
    // Set values
    config.set('database.host', 'localhost');
    config.set('database.port', 3306);
    config.set('database.user', 'admin');
    config.set('features.autoSave', true);
    config.set('features.interval', 300);
    
    // Get values
    console.log('Host:', config.getString('database.host'));
    console.log('Port:', config.getInt('database.port'));
    console.log('Auto-save:', config.getBoolean('features.autoSave'));
    
    // Get section
    const dbSection = config.getConfigurationSection('database');
    if (dbSection) {
        console.log('Database config:');
        for (const key of dbSection.getKeys(false)) {
            console.log(`  ${key} = ${dbSection.get(key)}`);
        }
    }
}

// Example 2: Comments and headers
async function commentsExample() {
    console.log('\n=== Comments Example ===');
    
    const config = new YamlConfiguration();
    
    // Set header
    config.setHeader([
        'My Application Configuration',
        'Edit with care!'
    ]);
    
    // Add data with comments
    config.set('server.host', '0.0.0.0');
    config.setComment('server.host', 'Server bind address');
    
    config.set('server.port', 8080);
    config.setComment('server.port', [
        'Server port',
        'Default: 8080'
    ]);
    
    // Save to file
    await config.save('./test-config.yml');
    console.log('Saved configuration with comments');
}

// Example 3: Defaults
async function defaultsExample() {
    console.log('\n=== Defaults Example ===');
    
    const config = new YamlConfiguration();
    
    // Add defaults
    config.addDefaultsFromMap({
        database: {
            host: 'localhost',
            port: 3306,
            timeout: 30
        },
        logging: {
            level: 'INFO',
            file: 'app.log'
        }
    });
    
    // Enable copy defaults
    config.options().copyDefaultsWith(true);
    
    // Get with default fallback
    console.log('Host:', config.getString('database.host')); // uses default
    console.log('Timeout:', config.getInt('database.timeout')); // uses default
    
    // Override a default
    config.set('database.host', '192.168.1.100');
    console.log('Host after override:', config.getString('database.host'));
}

// Example 4: Validation
async function validationExample() {
    console.log('\n=== Validation Example ===');
    
    const config = new YamlConfiguration();
    config.set('server.host', 'localhost');
    config.set('server.port', 8080);
    config.set('server.mode', 'production');
    
    try {
        // Require values
        const host = ConfigurationValidator.requireString(config, 'server.host');
        const port = ConfigurationValidator.requireInt(config, 'server.port');
        
        console.log(`Server: ${host}:${port}`);
        
        // Validate range
        const validPort = ConfigurationValidator.requireInRange(config, 'server.port', 1024, 65535);
        console.log('Port is in valid range:', validPort);
        
        // Validate enum
        const mode = ConfigurationValidator.requireOneOf(
            config,
            'server.mode',
            ['development', 'staging', 'production']
        );
        console.log('Mode:', mode);
        
    } catch (error: any) {
        console.error('Validation error:', error.message);
    }
}

// Example 5: Serializable objects
class Location implements ConfigurationSerializable {
    constructor(
        public x: number,
        public y: number,
        public z: number,
        public world: string = 'world'
    ) {}

    serialize(): Record<string, any> {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            world: this.world
        };
    }

    static deserialize(data: Record<string, any>): Location {
        return new Location(
            data.x || 0,
            data.y || 0,
            data.z || 0,
            data.world || 'world'
        );
    }

    toString(): string {
        return `Location(${this.x}, ${this.y}, ${this.z}, ${this.world})`;
    }
}

async function serializationExample() {
    console.log('\n=== Serialization Example ===');
    
    // Register class
    ConfigurationSerialization.registerClass(Location, 'Location');
    
    const config = new YamlConfiguration();
    
    // Save location object
    const spawn = new Location(0, 64, 0, 'world');
    config.set('spawn', spawn);
    
    console.log('Set spawn location:', spawn.toString());
    
    // Simulate save/load cycle
    const data = config.toObject();
    
    const newConfig = new YamlConfiguration();
    newConfig.fromObject(data);
    
    // Get location back
    const loadedSpawn = newConfig.get('spawn');
    console.log('Loaded spawn:', loadedSpawn);
}

// Example 6: Sections and deep operations
async function sectionsExample() {
    console.log('\n=== Sections Example ===');
    
    const config = new YamlConfiguration();
    
    // Create section with map
    config.createSectionWithMap('players.admin', {
        name: 'AdminUser',
        permissions: ['*'],
        level: 100
    });
    
    config.createSectionWithMap('players.guest', {
        name: 'Guest',
        permissions: ['chat', 'look'],
        level: 1
    });
    
    // Get all keys (deep)
    const allKeys = config.getKeys(true);
    console.log('All keys:', Array.from(allKeys));
    
    // Get player section
    const playersSection = config.getConfigurationSection('players');
    if (playersSection) {
        console.log('\nPlayers:');
        for (const playerKey of playersSection.getKeys(false)) {
            const playerSection = playersSection.getConfigurationSection(playerKey);
            if (playerSection) {
                const name = playerSection.getString('name');
                const level = playerSection.getInt('level');
                console.log(`  ${playerKey}: ${name} (Level ${level})`);
            }
        }
    }
}

// Run all examples
async function main() {
    try {
        await basicExample();
        await commentsExample();
        await defaultsExample();
        await validationExample();
        await serializationExample();
        await sectionsExample();
        
        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
