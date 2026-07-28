/**
 * ConfigurationException - Base exception for configuration errors
 * Mirrors Bukkit's ConfigurationException
 */
export class ConfigurationException extends Error {
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'ConfigurationException';
        
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationException);
        }
    }
}

/**
 * InvalidConfigurationException - Exception for invalid configuration format
 * Mirrors Bukkit's InvalidConfigurationException
 */
export class InvalidConfigurationException extends ConfigurationException {
    constructor(message: string, cause?: Error) {
        super(message, cause);
        this.name = 'InvalidConfigurationException';
    }
}

/**
 * PathNotFoundException - Exception when a required path is not found
 */
export class PathNotFoundException extends ConfigurationException {
    private readonly _path: string;

    constructor(path: string, message?: string) {
        super(message || `Required path not found: ${path}`);
        this.name = 'PathNotFoundException';
        this._path = path;
    }

    public getPath(): string {
        return this._path;
    }
}

/**
 * TypeMismatchException - Exception when value type doesn't match expected type
 */
export class TypeMismatchException extends ConfigurationException {
    private readonly _path: string;
    private readonly _expectedType: string;
    private readonly _actualType: string;

    constructor(path: string, expectedType: string, actualType: string) {
        super(`Type mismatch at ${path}: expected ${expectedType}, got ${actualType}`);
        this.name = 'TypeMismatchException';
        this._path = path;
        this._expectedType = expectedType;
        this._actualType = actualType;
    }

    public getPath(): string {
        return this._path;
    }

    public getExpectedType(): string {
        return this._expectedType;
    }

    public getActualType(): string {
        return this._actualType;
    }
}
