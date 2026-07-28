import { Configuration, ConfigurationOptions } from './Configuration';

/**
 * MemoryConfigurationOptions - Implementation of ConfigurationOptions
 * Mirrors Bukkit's MemoryConfigurationOptions
 */
export class MemoryConfigurationOptions implements ConfigurationOptions {
    private readonly _configuration: Configuration;
    private _pathSeparator: string = '.';
    private _copyDefaults: boolean = false;

    constructor(configuration: Configuration) {
        this._configuration = configuration;
    }

    configuration(): Configuration {
        return this._configuration;
    }

    pathSeparator(): string {
        return this._pathSeparator;
    }

    pathSeparatorWith(separator: string): ConfigurationOptions {
        this._pathSeparator = separator;
        return this;
    }

    copyDefaults(): boolean {
        return this._copyDefaults;
    }

    copyDefaultsWith(copy: boolean): ConfigurationOptions {
        this._copyDefaults = copy;
        return this;
    }
}
