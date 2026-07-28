import { getTokenName, ServiceToken } from '../types/ServiceTypes';

/**
 * Base exception for service-related errors
 */
export class ServiceException extends Error {
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'ServiceException';
        
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ServiceException);
        }
    }
}

/**
 * Thrown when service is not found
 */
export class ServiceNotFoundException extends ServiceException {
    constructor(public readonly token: ServiceToken) {
        super(`Service not found: ${getTokenName(token)}`);
        this.name = 'ServiceNotFoundException';
    }
}

/**
 * Thrown when trying to register duplicate service with same priority
 */
export class DuplicateServiceException extends ServiceException {
    constructor(
        public readonly token: ServiceToken,
        public readonly providerName: string
    ) {
        super(`Service ${getTokenName(token)} is already registered by ${providerName}`);
        this.name = 'DuplicateServiceException';
    }
}

/**
 * Thrown when circular dependency is detected
 */
export class CircularDependencyException extends ServiceException {
    constructor(public readonly cycle: ServiceToken[]) {
        super(
            `Circular dependency detected: ${cycle.map(t => getTokenName(t)).join(' -> ')}`
        );
        this.name = 'CircularDependencyException';
    }
}

/**
 * Thrown when invalid service registration is attempted
 */
export class InvalidServiceException extends ServiceException {
    constructor(
        public readonly token: ServiceToken,
        reason: string
    ) {
        super(`Invalid service registration for ${getTokenName(token)}: ${reason}`);
        this.name = 'InvalidServiceException';
    }
}

/**
 * Thrown when invalid provider attempts registration
 */
export class InvalidProviderException extends ServiceException {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidProviderException';
    }
}

/**
 * Thrown when dependency resolution fails
 */
export class DependencyResolveException extends ServiceException {
    constructor(
        public readonly token: ServiceToken,
        public readonly missingDependency: ServiceToken,
        message?: string
    ) {
        super(
            message || `Failed to resolve ${getTokenName(token)}: missing dependency ${getTokenName(missingDependency)}`
        );
        this.name = 'DependencyResolveException';
    }
}

/**
 * Thrown when invalid token is provided
 */
export class InvalidTokenException extends ServiceException {
    constructor(token: any) {
        super(`Invalid service token: ${typeof token === 'object' ? JSON.stringify(token) : String(token)}`);
        this.name = 'InvalidTokenException';
    }
}
