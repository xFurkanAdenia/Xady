/**
 * WorkerPoolException - Base exception for worker pool errors
 */
export class WorkerPoolException extends Error {
    constructor(message: string, cause?: Error) {
        super(message);
        this.name = 'WorkerPoolException';
        
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, WorkerPoolException);
        }
    }
}

/**
 * WorkerCrashException - Thrown when a worker crashes unexpectedly
 */
export class WorkerCrashException extends WorkerPoolException {
    readonly #workerId: string;
    readonly #exitCode: number;
    readonly #lastState: string;

    constructor(workerId: string, exitCode: number, lastState: string, message?: string, cause?: Error) {
        super(message || `Worker ${workerId} crashed with exit code ${exitCode}`, cause);
        this.name = 'WorkerCrashException';
        this.#workerId = workerId;
        this.#exitCode = exitCode;
        this.#lastState = lastState;
    }

    public getWorkerId(): string {
        return this.#workerId;
    }

    public getExitCode(): number {
        return this.#exitCode;
    }

    public getLastState(): string {
        return this.#lastState;
    }
}

/**
 * TaskTimeoutException - Thrown when a task exceeds its timeout
 */
export class TaskTimeoutException extends WorkerPoolException {
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #timeoutDuration: number;
    readonly #executionTime: number;

    constructor(taskId: string, taskName: string, timeoutDuration: number, executionTime: number) {
        super(`Task ${taskName} (${taskId}) timed out after ${executionTime}ms (limit: ${timeoutDuration}ms)`);
        this.name = 'TaskTimeoutException';
        this.#taskId = taskId;
        this.#taskName = taskName;
        this.#timeoutDuration = timeoutDuration;
        this.#executionTime = executionTime;
    }

    public getTaskId(): string {
        return this.#taskId;
    }

    public getTaskName(): string {
        return this.#taskName;
    }

    public getTimeoutDuration(): number {
        return this.#timeoutDuration;
    }

    public getExecutionTime(): number {
        return this.#executionTime;
    }
}

/**
 * TaskCancelledException - Thrown when a task is cancelled
 */
export class TaskCancelledException extends WorkerPoolException {
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #reason: string;
    readonly #cancelledBy: string | null;

    constructor(taskId: string, taskName: string, reason: string, cancelledBy?: string) {
        super(`Task ${taskName} (${taskId}) was cancelled: ${reason}`);
        this.name = 'TaskCancelledException';
        this.#taskId = taskId;
        this.#taskName = taskName;
        this.#reason = reason;
        this.#cancelledBy = cancelledBy || null;
    }

    public getTaskId(): string {
        return this.#taskId;
    }

    public getTaskName(): string {
        return this.#taskName;
    }

    public getReason(): string {
        return this.#reason;
    }

    public getCancelledBy(): string | null {
        return this.#cancelledBy;
    }
}

/**
 * SerializationException - Thrown when data cannot be serialized for worker communication
 */
export class SerializationException extends WorkerPoolException {
    readonly #path: string;
    readonly #invalidType: string;
    readonly #value: any;

    constructor(path: string, invalidType: string, value: any, message?: string) {
        super(
            message || 
            `Cannot serialize value at path "${path}": ${invalidType} is not transferable to worker threads. ` +
            `Workers can only receive plain objects, arrays, primitives, Buffer, TypedArray, ArrayBuffer, SharedArrayBuffer, and MessagePort.`
        );
        this.name = 'SerializationException';
        this.#path = path;
        this.#invalidType = invalidType;
        this.#value = value;
    }

    public getPath(): string {
        return this.#path;
    }

    public getInvalidType(): string {
        return this.#invalidType;
    }

    public getValue(): any {
        return this.#value;
    }
}

/**
 * WorkerInitializationException - Thrown when a worker fails to initialize
 */
export class WorkerInitializationException extends WorkerPoolException {
    readonly #workerPath: string;
    readonly #workerId: string | null;

    constructor(workerPath: string, message: string, cause?: Error, workerId?: string) {
        super(`Failed to initialize worker at "${workerPath}": ${message}`, cause);
        this.name = 'WorkerInitializationException';
        this.#workerPath = workerPath;
        this.#workerId = workerId || null;
    }

    public getWorkerPath(): string {
        return this.#workerPath;
    }

    public getWorkerId(): string | null {
        return this.#workerId;
    }
}

/**
 * TaskExecutionException - Thrown when a task fails during execution
 */
export class TaskExecutionException extends WorkerPoolException {
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #workerId: string | null;
    readonly #retryCount: number;

    constructor(
        taskId: string, 
        taskName: string, 
        message: string, 
        cause?: Error,
        workerId?: string,
        retryCount: number = 0
    ) {
        super(`Task ${taskName} (${taskId}) failed: ${message}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`, cause);
        this.name = 'TaskExecutionException';
        this.#taskId = taskId;
        this.#taskName = taskName;
        this.#workerId = workerId || null;
        this.#retryCount = retryCount;
    }

    public getTaskId(): string {
        return this.#taskId;
    }

    public getTaskName(): string {
        return this.#taskName;
    }

    public getWorkerId(): string | null {
        return this.#workerId;
    }

    public getRetryCount(): number {
        return this.#retryCount;
    }
}

/**
 * WorkerProtocolException - Thrown when a protocol violation occurs
 */
export class WorkerProtocolException extends WorkerPoolException {
    readonly #workerId: string;
    readonly #messageType: string | null;
    readonly #violation: string;

    constructor(workerId: string, violation: string, messageType?: string, cause?: Error) {
        super(`Protocol violation from worker ${workerId}: ${violation}`, cause);
        this.name = 'WorkerProtocolException';
        this.#workerId = workerId;
        this.#messageType = messageType || null;
        this.#violation = violation;
    }

    public getWorkerId(): string {
        return this.#workerId;
    }

    public getMessageType(): string | null {
        return this.#messageType;
    }

    public getViolation(): string {
        return this.#violation;
    }
}

/**
 * TaskNotFoundException - Thrown when a task is not found in the registry
 */
export class TaskNotFoundException extends WorkerPoolException {
    readonly #taskName: string;

    constructor(taskName: string) {
        super(`Task "${taskName}" is not registered. Use pool.registerTask() to register tasks before execution.`);
        this.name = 'TaskNotFoundException';
        this.#taskName = taskName;
    }

    public getTaskName(): string {
        return this.#taskName;
    }
}

/**
 * DuplicateTaskException - Thrown when attempting to register a task that already exists
 */
export class DuplicateTaskException extends WorkerPoolException {
    readonly #taskName: string;

    constructor(taskName: string) {
        super(`Task "${taskName}" is already registered. Use a different name or unregister the existing task first.`);
        this.name = 'DuplicateTaskException';
        this.#taskName = taskName;
    }

    public getTaskName(): string {
        return this.#taskName;
    }
}

/**
 * WorkerPoolShutdownException - Thrown when attempting to use a shutdown pool
 */
export class WorkerPoolShutdownException extends WorkerPoolException {
    constructor() {
        super('WorkerPool has been shut down. Initialize it again with init() before use.');
        this.name = 'WorkerPoolShutdownException';
    }
}
