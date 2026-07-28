/**
 * Base exception for all module-related errors
 */
export class ModuleException extends Error {
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'ModuleException';
        
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ModuleException);
        }
    }
}

/**
 * Thrown when module loading fails
 */
export class ModuleLoadException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        message: string,
        cause?: Error
    ) {
        super(`Failed to load module '${moduleName}': ${message}`, cause);
        this.name = 'ModuleLoadException';
    }
}

/**
 * Thrown when module enabling fails
 */
export class ModuleEnableException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        message: string,
        cause?: Error
    ) {
        super(`Failed to enable module '${moduleName}': ${message}`, cause);
        this.name = 'ModuleEnableException';
    }
}

/**
 * Thrown when module disabling fails
 */
export class ModuleDisableException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        message: string,
        cause?: Error
    ) {
        super(`Failed to disable module '${moduleName}': ${message}`, cause);
        this.name = 'ModuleDisableException';
    }
}

/**
 * Thrown when module dependency resolution fails
 */
export class ModuleDependencyException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        public readonly missingDependency: string,
        message?: string
    ) {
        super(
            message || `Module '${moduleName}' depends on '${missingDependency}' which is not available`,
        );
        this.name = 'ModuleDependencyException';
    }
}

/**
 * Thrown when manifest is invalid
 */
export class ModuleManifestException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        public readonly validationErrors: string[],
        message?: string
    ) {
        super(
            message || `Invalid manifest for module '${moduleName}':\n${validationErrors.join('\n')}`,
        );
        this.name = 'ModuleManifestException';
    }
}

/**
 * Thrown when circular dependency is detected
 */
export class CircularDependencyException extends ModuleException {
    constructor(
        public readonly cycle: string[],
        message?: string
    ) {
        super(
            message || `Circular dependency detected: ${cycle.join(' -> ')} -> ${cycle[0]}`,
        );
        this.name = 'CircularDependencyException';
    }
}

/**
 * Thrown when sandbox security violation occurs
 */
export class ModuleSandboxException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        public readonly violation: string,
        message?: string
    ) {
        super(
            message || `Security violation in module '${moduleName}': ${violation}`,
        );
        this.name = 'ModuleSandboxException';
    }
}

/**
 * Thrown when module reload fails
 */
export class ModuleReloadException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        message: string,
        cause?: Error
    ) {
        super(`Failed to reload module '${moduleName}': ${message}`, cause);
        this.name = 'ModuleReloadException';
    }
}

/**
 * Thrown when invalid state transition is attempted
 */
export class ModuleStateException extends ModuleException {
    constructor(
        public readonly moduleName: string,
        public readonly currentState: string,
        public readonly targetState: string,
        message?: string
    ) {
        super(
            message || `Invalid state transition for module '${moduleName}': ${currentState} -> ${targetState}`,
        );
        this.name = 'ModuleStateException';
    }
}
