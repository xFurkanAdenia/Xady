/**
 * TaskState - Task lifecycle states
 * 
 * State transitions:
 * QUEUED -> WAITING -> RUNNING -> COMPLETED
 * RUNNING -> FAILED -> RETRYING -> QUEUED (retry cycle)
 * Any non-terminal -> CANCELLED
 * RUNNING -> TIMEOUT
 * Any state -> DISPOSED (cleanup)
 */
export enum TaskState {
    /**
     * Task is queued and waiting for a worker
     */
    QUEUED = 'QUEUED',

    /**
     * Task has been assigned to a worker but not yet started
     */
    WAITING = 'WAITING',

    /**
     * Task is currently being executed
     */
    RUNNING = 'RUNNING',

    /**
     * Task completed successfully
     */
    COMPLETED = 'COMPLETED',

    /**
     * Task failed with an error
     */
    FAILED = 'FAILED',

    /**
     * Task was cancelled
     */
    CANCELLED = 'CANCELLED',

    /**
     * Task exceeded its timeout
     */
    TIMEOUT = 'TIMEOUT',

    /**
     * Task is being retried after failure
     */
    RETRYING = 'RETRYING',

    /**
     * Task has been disposed and cleaned up (final state)
     */
    DISPOSED = 'DISPOSED'
}

/**
 * Valid state transitions
 */
export const VALID_TASK_TRANSITIONS = new Map<TaskState, Set<TaskState>>([
    [TaskState.QUEUED, new Set([TaskState.WAITING, TaskState.RUNNING, TaskState.CANCELLED, TaskState.DISPOSED])],
    [TaskState.WAITING, new Set([TaskState.RUNNING, TaskState.CANCELLED, TaskState.DISPOSED])],
    [TaskState.RUNNING, new Set([TaskState.COMPLETED, TaskState.FAILED, TaskState.TIMEOUT, TaskState.CANCELLED, TaskState.DISPOSED])],
    [TaskState.COMPLETED, new Set([TaskState.DISPOSED])],
    [TaskState.FAILED, new Set([TaskState.RETRYING, TaskState.DISPOSED])],
    [TaskState.CANCELLED, new Set([TaskState.DISPOSED])],
    [TaskState.TIMEOUT, new Set([TaskState.RETRYING, TaskState.DISPOSED])],
    [TaskState.RETRYING, new Set([TaskState.QUEUED, TaskState.FAILED, TaskState.DISPOSED])],
    [TaskState.DISPOSED, new Set()] // Final state - no transitions allowed
]);

/**
 * Check if a state transition is valid
 */
export function isValidTaskTransition(from: TaskState, to: TaskState): boolean {
    const allowedTransitions = VALID_TASK_TRANSITIONS.get(from);
    return allowedTransitions ? allowedTransitions.has(to) : false;
}

/**
 * Check if a task state is terminal (task is finished)
 */
export function isTerminalTaskState(state: TaskState): boolean {
    return state === TaskState.COMPLETED || 
           state === TaskState.FAILED || 
           state === TaskState.CANCELLED || 
           state === TaskState.TIMEOUT ||
           state === TaskState.DISPOSED;
}

/**
 * Check if a task state is active (task is being processed)
 */
export function isActiveTaskState(state: TaskState): boolean {
    return state === TaskState.QUEUED || 
           state === TaskState.WAITING || 
           state === TaskState.RUNNING ||
           state === TaskState.RETRYING;
}

/**
 * Check if a task can be cancelled
 */
export function isTaskCancellable(state: TaskState): boolean {
    return !isTerminalTaskState(state);
}

/**
 * Check if a task can be retried
 */
export function isTaskRetryable(state: TaskState): boolean {
    return state === TaskState.FAILED || state === TaskState.TIMEOUT;
}
