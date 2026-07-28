import { ConfigurationSection } from '../Configuration';
import { PathNotFoundException, TypeMismatchException } from '../exceptions/ConfigurationException';

/**
 * ConfigurationValidator - Validation utilities for configurations
 * Provides Bukkit-style require methods that throw exceptions
 */
export class ConfigurationValidator {
    /**
     * Requires that a path exists
     */
    public static require(section: ConfigurationSection, path: string): any {
        const value = section.get(path);
        if (value === null || value === undefined) {
            throw new PathNotFoundException(path);
        }
        return value;
    }

    /**
     * Requires a string value at path
     */
    public static requireString(section: ConfigurationSection, path: string): string {
        const value = ConfigurationValidator.require(section, path);
        
        if (typeof value !== 'string') {
            throw new TypeMismatchException(path, 'string', typeof value);
        }
        
        return value;
    }

    /**
     * Requires a boolean value at path
     */
    public static requireBoolean(section: ConfigurationSection, path: string): boolean {
        const value = ConfigurationValidator.require(section, path);
        
        if (typeof value !== 'boolean') {
            throw new TypeMismatchException(path, 'boolean', typeof value);
        }
        
        return value;
    }

    /**
     * Requires an integer value at path
     */
    public static requireInt(section: ConfigurationSection, path: string): number {
        const value = ConfigurationValidator.require(section, path);
        
        if (typeof value !== 'number' || !Number.isInteger(value)) {
            throw new TypeMismatchException(path, 'integer', typeof value);
        }
        
        return value;
    }

    /**
     * Requires a double value at path
     */
    public static requireDouble(section: ConfigurationSection, path: string): number {
        const value = ConfigurationValidator.require(section, path);
        
        if (typeof value !== 'number') {
            throw new TypeMismatchException(path, 'number', typeof value);
        }
        
        return value;
    }

    /**
     * Requires a number value at path (int or double)
     */
    public static requireNumber(section: ConfigurationSection, path: string): number {
        return ConfigurationValidator.requireDouble(section, path);
    }

    /**
     * Requires a ConfigurationSection at path
     */
    public static requireSection(section: ConfigurationSection, path: string): ConfigurationSection {
        const value = section.getConfigurationSection(path);
        
        if (!value) {
            throw new PathNotFoundException(path, `Required section not found: ${path}`);
        }
        
        return value;
    }

    /**
     * Requires a list at path
     */
    public static requireList(section: ConfigurationSection, path: string): any[] {
        const value = ConfigurationValidator.require(section, path);
        
        if (!Array.isArray(value)) {
            throw new TypeMismatchException(path, 'list', typeof value);
        }
        
        return value;
    }

    /**
     * Requires a string list at path
     */
    public static requireStringList(section: ConfigurationSection, path: string): string[] {
        const list = ConfigurationValidator.requireList(section, path);
        
        for (let i = 0; i < list.length; i++) {
            if (typeof list[i] !== 'string') {
                throw new TypeMismatchException(
                    `${path}[${i}]`,
                    'string',
                    typeof list[i]
                );
            }
        }
        
        return list as string[];
    }

    /**
     * Requires an integer list at path
     */
    public static requireIntList(section: ConfigurationSection, path: string): number[] {
        const list = ConfigurationValidator.requireList(section, path);
        
        for (let i = 0; i < list.length; i++) {
            if (typeof list[i] !== 'number' || !Number.isInteger(list[i])) {
                throw new TypeMismatchException(
                    `${path}[${i}]`,
                    'integer',
                    typeof list[i]
                );
            }
        }
        
        return list as number[];
    }

    /**
     * Requires a map at path
     */
    public static requireMap(section: ConfigurationSection, path: string): Record<string, any> {
        const value = ConfigurationValidator.require(section, path);
        
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            throw new TypeMismatchException(path, 'map', typeof value);
        }
        
        return value;
    }

    /**
     * Validates that value is in allowed range
     */
    public static requireInRange(
        section: ConfigurationSection,
        path: string,
        min: number,
        max: number
    ): number {
        const value = ConfigurationValidator.requireNumber(section, path);
        
        if (value < min || value > max) {
            throw new Error(
                `Value at ${path} must be between ${min} and ${max}, got ${value}`
            );
        }
        
        return value;
    }

    /**
     * Validates that string matches pattern
     */
    public static requirePattern(
        section: ConfigurationSection,
        path: string,
        pattern: RegExp
    ): string {
        const value = ConfigurationValidator.requireString(section, path);
        
        if (!pattern.test(value)) {
            throw new Error(
                `Value at ${path} does not match required pattern: ${pattern}`
            );
        }
        
        return value;
    }

    /**
     * Validates that value is one of allowed values
     */
    public static requireOneOf<T>(
        section: ConfigurationSection,
        path: string,
        allowed: T[]
    ): T {
        const value = ConfigurationValidator.require(section, path) as T;
        
        if (!allowed.includes(value)) {
            throw new Error(
                `Value at ${path} must be one of [${allowed.join(', ')}], got ${value}`
            );
        }
        
        return value;
    }
}
