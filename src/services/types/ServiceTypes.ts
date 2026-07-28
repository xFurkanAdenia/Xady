import { BaseModule } from '../../models/BaseModule';

/**
 * Service Priority - Bukkit ServicesManager compatible
 */
export enum ServicePriority {
    LOWEST = 5,
    LOW = 4,
    NORMAL = 3,
    HIGH = 2,
    HIGHEST = 1,
    MONITOR = 0
}

/**
 * Service Lifetime - Determines how instances are created
 */
export enum ServiceLifetime {
    /** Single instance shared across the application */
    SINGLETON = 'SINGLETON',
    
    /** New instance per module scope */
    SCOPED = 'SCOPED',
    
    /** New instance every time */
    TRANSIENT = 'TRANSIENT',
    
    /** Lazy-initialized singleton */
    LAZY_SINGLETON = 'LAZY_SINGLETON',
    
    /** Created by factory function */
    FACTORY = 'FACTORY'
}

/**
 * Service Token - Unique identifier for a service
 */
export type ServiceToken<T = any> = 
    | (new (...args: any[]) => T)
    | (abstract new (...args: any[]) => T)
    | symbol
    | string;

/**
 * Service Factory - Function that creates service instances
 */
export type ServiceFactory<T = any> = (container: IServiceContainer) => T | Promise<T>;

/**
 * Service Container interface
 */
export interface IServiceContainer {
    get<T>(token: ServiceToken<T>): T | undefined;
    getRequired<T>(token: ServiceToken<T>): T;
    has(token: ServiceToken<any>): boolean;
}

/**
 * Service Descriptor - Complete service registration information
 */
export interface ServiceDescriptor<T = any> {
    /** Service token/identifier */
    token: ServiceToken<T>;
    
    /** Service lifetime */
    lifetime: ServiceLifetime;
    
    /** Service priority */
    priority: ServicePriority;
    
    /** Module that registered this service */
    provider: BaseModule;
    
    /** Concrete implementation (for SINGLETON/TRANSIENT) */
    implementation?: new (...args: any[]) => T;
    
    /** Factory function (for FACTORY/LAZY) */
    factory?: ServiceFactory<T>;
    
    /** Direct instance (for registerInstance) */
    instance?: T;
    
    /** Service metadata */
    metadata?: ServiceMetadata;
    
    /** Registration timestamp */
    registeredAt: number;
    
    /** Last resolve timestamp */
    lastResolvedAt?: number;
    
    /** Resolve count */
    resolveCount: number;
    
    /** Is readonly (MONITOR priority) */
    readonly: boolean;
}

/**
 * Service Metadata - Optional information about service
 */
export interface ServiceMetadata {
    description?: string;
    author?: string;
    version?: string;
    website?: string;
    dependencies?: ServiceToken[];
    softDependencies?: ServiceToken[];
    tags?: string[];
}

/**
 * Service Registration - Return value when registering
 */
export interface ServiceRegistration<T = any> {
    token: ServiceToken<T>;
    descriptor: ServiceDescriptor<T>;
    unregister: () => void;
}

/**
 * Create a unique service token
 */
export function createServiceToken<T>(description?: string): symbol {
    return Symbol(description || 'ServiceToken');
}

/**
 * Gets token name for display
 */
export function getTokenName(token: ServiceToken): string {
    if (typeof token === 'function') {
        return token.name || '<anonymous>';
    }
    if (typeof token === 'symbol') {
        return token.description || '<symbol>';
    }
    return String(token);
}
