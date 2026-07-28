/**
 * Module lifecycle states - mirrors Paper Plugin loading phases
 */
export enum ModuleState {
    /** Module is discovered but not yet validated */
    DISCOVERED = 'DISCOVERED',
    
    /** Manifest validated successfully */
    VALIDATED = 'VALIDATED',
    
    /** Dependencies resolved */
    RESOLVED = 'RESOLVED',
    
    /** Currently loading */
    LOADING = 'LOADING',
    
    /** Module class loaded */
    LOADED = 'LOADED',
    
    /** Bootstrapping (onLoad called) */
    BOOTSTRAPPING = 'BOOTSTRAPPING',
    
    /** Pre-enable phase */
    PRE_ENABLE = 'PRE_ENABLE',
    
    /** Currently enabling */
    ENABLING = 'ENABLING',
    
    /** Module fully enabled and running */
    ENABLED = 'ENABLED',
    
    /** Pre-disable phase */
    PRE_DISABLE = 'PRE_DISABLE',
    
    /** Currently disabling */
    DISABLING = 'DISABLING',
    
    /** Module disabled */
    DISABLED = 'DISABLED',
    
    /** Currently unloading */
    UNLOADING = 'UNLOADING',
    
    /** Module unloaded */
    UNLOADED = 'UNLOADED',
    
    /** Module failed to load/enable */
    FAILED = 'FAILED',
    
    /** Currently reloading */
    RELOADING = 'RELOADING'
}

/**
 * Valid state transitions
 */
export const VALID_TRANSITIONS: Map<ModuleState, ModuleState[]> = new Map([
    [ModuleState.DISCOVERED, [ModuleState.VALIDATED, ModuleState.FAILED]],
    [ModuleState.VALIDATED, [ModuleState.RESOLVED, ModuleState.FAILED]],
    [ModuleState.RESOLVED, [ModuleState.LOADING, ModuleState.FAILED]],
    [ModuleState.LOADING, [ModuleState.LOADED, ModuleState.FAILED]],
    [ModuleState.LOADED, [ModuleState.BOOTSTRAPPING, ModuleState.FAILED, ModuleState.UNLOADING]],
    [ModuleState.BOOTSTRAPPING, [ModuleState.PRE_ENABLE, ModuleState.FAILED]],
    [ModuleState.PRE_ENABLE, [ModuleState.ENABLING, ModuleState.FAILED]],
    [ModuleState.ENABLING, [ModuleState.ENABLED, ModuleState.FAILED]],
    [ModuleState.ENABLED, [ModuleState.PRE_DISABLE, ModuleState.RELOADING, ModuleState.FAILED]],
    [ModuleState.PRE_DISABLE, [ModuleState.DISABLING]],
    [ModuleState.DISABLING, [ModuleState.DISABLED, ModuleState.FAILED]],
    [ModuleState.DISABLED, [ModuleState.UNLOADING, ModuleState.PRE_ENABLE]],
    [ModuleState.UNLOADING, [ModuleState.UNLOADED, ModuleState.FAILED]],
    [ModuleState.UNLOADED, [ModuleState.DISCOVERED]],
    [ModuleState.FAILED, [ModuleState.UNLOADING, ModuleState.DISCOVERED]],
    [ModuleState.RELOADING, [ModuleState.PRE_DISABLE]]
]);

/**
 * Checks if state transition is valid
 */
export function isValidTransition(from: ModuleState, to: ModuleState): boolean {
    const allowed = VALID_TRANSITIONS.get(from);
    return allowed ? allowed.includes(to) : false;
}
