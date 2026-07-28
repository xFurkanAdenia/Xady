/**
 * WorkerState - Worker lifecycle states
 * 
 * State transitions:
 * CREATED -> STARTING -> READY -> BUSY -> READY (cycle)
 * Any state -> STOPPING -> STOPPED
 * Any state -> CRASHED -> RESTARTING -> STARTING
 * Any state -> DISPOSED (final state)
 */
export enum WorkerState {
    /**
     * Worker has been created but not yet started
     */
    CREATED = 'CREATED',

    /**
     * Worker thread is starting up
     */
    STARTING = 'STARTING',

    /**
     * Worker is ready to accept tasks
     */
    READY = 'READY',

    /**
     * Worker is currently executing a task
     */
    BUSY = 'BUSY',

    /**
     * Worker is waiting (e.g., for I/O, network)
     */
    WAITING = 'WAITING',

    /**
     * Worker is gracefully shutting down
     */
    STOPPING = 'STOPPING',

    /**
     * Worker has stopped cleanly
     */
    STOPPED = 'STOPPED',

    /**
     * Worker has crashed unexpectedly
     */
    CRASHED = 'CRASHED',

    /**
     * Worker is being restarted after a crash
     */
    RESTARTING = 'RESTARTING',

    /**
     * Worker has been disposed and cannot be reused (final state)
     */
    DISPOSED = 'DISPOSED'
}

/**
 * Valid state transitions
 */
export const VALID_WORKER_TRANSITIONS = new Map<WorkerState, Set<WorkerState>>([
    [WorkerState.CREATED, new Set([WorkerState.STARTING, WorkerState.DISPOSED])],
    [WorkerState.STARTING, new Set([WorkerState.READY, WorkerState.CRASHED, WorkerState.STOPPING, WorkerState.DISPOSED])],
    [WorkerState.READY, new Set([WorkerState.BUSY, WorkerState.WAITING, WorkerState.STOPPING, WorkerState.CRASHED, WorkerState.DISPOSED])],
    [WorkerState.BUSY, new Set([WorkerState.READY, WorkerState.WAITING, WorkerState.STOPPING, WorkerState.CRASHED, WorkerState.DISPOSED])],
    [WorkerState.WAITING, new Set([WorkerState.BUSY, WorkerState.READY, WorkerState.STOPPING, WorkerState.CRASHED, WorkerState.DISPOSED])],
    [WorkerState.STOPPING, new Set([WorkerState.STOPPED, WorkerState.CRASHED, WorkerState.DISPOSED])],
    [WorkerState.STOPPED, new Set([WorkerState.RESTARTING, WorkerState.DISPOSED])],
    [WorkerState.CRASHED, new Set([WorkerState.RESTARTING, WorkerState.DISPOSED])],
    [WorkerState.RESTARTING, new Set([WorkerState.STARTING, WorkerState.CRASHED, WorkerState.DISPOSED])],
    [WorkerState.DISPOSED, new Set()] // Final state - no transitions allowed
]);

/**
 * Check if a state transition is valid
 */
export function isValidWorkerTransition(from: WorkerState, to: WorkerState): boolean {
    const allowedTransitions = VALID_WORKER_TRANSITIONS.get(from);
    return allowedTransitions ? allowedTransitions.has(to) : false;
}

/**
 * Check if a worker state is terminal (cannot execute tasks)
 */
export function isTerminalWorkerState(state: WorkerState): boolean {
    return state === WorkerState.STOPPED || 
           state === WorkerState.CRASHED || 
           state === WorkerState.DISPOSED;
}

/**
 * Check if a worker state is active (can accept or execute tasks)
 */
export function isActiveWorkerState(state: WorkerState): boolean {
    return state === WorkerState.READY || 
           state === WorkerState.BUSY || 
           state === WorkerState.WAITING;
}

/**
 * Check if a worker is available for task assignment
 */
export function isWorkerAvailable(state: WorkerState): boolean {
    return state === WorkerState.READY;
}
