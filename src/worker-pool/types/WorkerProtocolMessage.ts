/**
 * WorkerProtocolMessage - Message types for worker communication
 */

/**
 * Message types
 */
export enum WorkerMessageType {
    // Pool -> Worker
    START = 'START',
    CANCEL = 'CANCEL',
    PING = 'PING',
    SHUTDOWN = 'SHUTDOWN',
    TERMINATE = 'TERMINATE',
    
    // Worker -> Pool
    READY = 'READY',
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
    PROGRESS = 'PROGRESS',
    PONG = 'PONG',
    LOG = 'LOG',
    METRICS = 'METRICS',
    STATE_CHANGE = 'STATE_CHANGE',
    ERROR = 'ERROR'
}

/**
 * Base message interface
 */
export interface WorkerMessage {
    readonly type: WorkerMessageType;
    readonly timestamp: number;
    readonly workerId?: string;
}

/**
 * START - Pool tells worker to start executing a task
 */
export interface StartMessage extends WorkerMessage {
    readonly type: WorkerMessageType.START;
    readonly taskId: string;
    readonly taskName: string;
    readonly args: any[];
    readonly timeout?: number;
    readonly cpuAffinity?: string;
}

/**
 * CANCEL - Pool tells worker to cancel a task
 */
export interface CancelMessage extends WorkerMessage {
    readonly type: WorkerMessageType.CANCEL;
    readonly taskId: string;
    readonly reason: string;
}

/**
 * PING - Pool checks if worker is alive
 */
export interface PingMessage extends WorkerMessage {
    readonly type: WorkerMessageType.PING;
    readonly sequence: number;
}

/**
 * SHUTDOWN - Pool tells worker to shut down gracefully
 */
export interface ShutdownMessage extends WorkerMessage {
    readonly type: WorkerMessageType.SHUTDOWN;
    readonly gracePeriod: number;
}

/**
 * TERMINATE - Pool tells worker to terminate immediately
 */
export interface TerminateMessage extends WorkerMessage {
    readonly type: WorkerMessageType.TERMINATE;
}

/**
 * READY - Worker signals it's ready to accept tasks
 */
export interface ReadyMessage extends WorkerMessage {
    readonly type: WorkerMessageType.READY;
    readonly workerId: string;
    readonly threadId: number;
    readonly capabilities: WorkerCapabilities;
}

/**
 * SUCCESS - Worker completed task successfully
 */
export interface SuccessMessage extends WorkerMessage {
    readonly type: WorkerMessageType.SUCCESS;
    readonly taskId: string;
    readonly result: any;
    readonly executionTime: number;
}

/**
 * FAILURE - Worker failed to execute task
 */
export interface FailureMessage extends WorkerMessage {
    readonly type: WorkerMessageType.FAILURE;
    readonly taskId: string;
    readonly error: SerializedError;
    readonly executionTime: number;
}

/**
 * PROGRESS - Worker reports task progress
 */
export interface ProgressMessage extends WorkerMessage {
    readonly type: WorkerMessageType.PROGRESS;
    readonly taskId: string;
    readonly progress: any;
}

/**
 * PONG - Worker responds to PING
 */
export interface PongMessage extends WorkerMessage {
    readonly type: WorkerMessageType.PONG;
    readonly sequence: number;
    readonly metrics: WorkerMetricsSnapshot;
}

/**
 * LOG - Worker sends log message
 */
export interface LogMessage extends WorkerMessage {
    readonly type: WorkerMessageType.LOG;
    readonly level: 'debug' | 'info' | 'warn' | 'error';
    readonly message: string;
    readonly taskId?: string;
    readonly data?: any;
}

/**
 * METRICS - Worker sends periodic metrics
 */
export interface MetricsMessage extends WorkerMessage {
    readonly type: WorkerMessageType.METRICS;
    readonly metrics: WorkerMetricsSnapshot;
}

/**
 * STATE_CHANGE - Worker reports state change
 */
export interface StateChangeMessage extends WorkerMessage {
    readonly type: WorkerMessageType.STATE_CHANGE;
    readonly oldState: string;
    readonly newState: string;
    readonly reason?: string;
}

/**
 * ERROR - Worker reports an error
 */
export interface ErrorMessage extends WorkerMessage {
    readonly type: WorkerMessageType.ERROR;
    readonly error: SerializedError;
    readonly taskId?: string;
}

/**
 * Union type of all messages from pool to worker
 */
export type PoolToWorkerMessage = 
    | StartMessage 
    | CancelMessage 
    | PingMessage 
    | ShutdownMessage 
    | TerminateMessage;

/**
 * Union type of all messages from worker to pool
 */
export type WorkerToPoolMessage = 
    | ReadyMessage 
    | SuccessMessage 
    | FailureMessage 
    | ProgressMessage 
    | PongMessage 
    | LogMessage 
    | MetricsMessage 
    | StateChangeMessage 
    | ErrorMessage;

/**
 * Union type of all messages
 */
export type ProtocolMessage = PoolToWorkerMessage | WorkerToPoolMessage;

/**
 * Worker capabilities
 */
export interface WorkerCapabilities {
    readonly version: string;
    readonly platform: string;
    readonly arch: string;
    readonly nodeVersion: string;
    readonly cpuCount: number;
    readonly totalMemory: number;
}

/**
 * Worker metrics snapshot
 */
export interface WorkerMetricsSnapshot {
    readonly cpuUsage: number;
    readonly memoryUsage: MemoryUsage;
    readonly heapUsage: HeapUsage;
    readonly eventLoopDelay: number;
    readonly taskCount: number;
    readonly uptime: number;
}

/**
 * Memory usage information
 */
export interface MemoryUsage {
    readonly rss: number;
    readonly heapTotal: number;
    readonly heapUsed: number;
    readonly external: number;
    readonly arrayBuffers: number;
}

/**
 * Heap usage information
 */
export interface HeapUsage {
    readonly total: number;
    readonly used: number;
    readonly limit: number;
    readonly utilization: number;
}

/**
 * Serialized error (for structured cloning)
 */
export interface SerializedError {
    readonly name: string;
    readonly message: string;
    readonly stack?: string;
    readonly code?: string;
    readonly cause?: SerializedError;
}

/**
 * Create a START message
 */
export function createStartMessage(
    taskId: string,
    taskName: string,
    args: any[],
    timeout?: number,
    cpuAffinity?: string
): StartMessage {
    return {
        type: WorkerMessageType.START,
        timestamp: Date.now(),
        taskId,
        taskName,
        args,
        timeout,
        cpuAffinity
    };
}

/**
 * Create a CANCEL message
 */
export function createCancelMessage(taskId: string, reason: string): CancelMessage {
    return {
        type: WorkerMessageType.CANCEL,
        timestamp: Date.now(),
        taskId,
        reason
    };
}

/**
 * Create a PING message
 */
export function createPingMessage(sequence: number): PingMessage {
    return {
        type: WorkerMessageType.PING,
        timestamp: Date.now(),
        sequence
    };
}

/**
 * Create a SHUTDOWN message
 */
export function createShutdownMessage(gracePeriod: number): ShutdownMessage {
    return {
        type: WorkerMessageType.SHUTDOWN,
        timestamp: Date.now(),
        gracePeriod
    };
}

/**
 * Create a TERMINATE message
 */
export function createTerminateMessage(): TerminateMessage {
    return {
        type: WorkerMessageType.TERMINATE,
        timestamp: Date.now()
    };
}

/**
 * Serialize an error for structured cloning
 */
export function serializeError(error: Error): SerializedError {
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        cause: error.cause instanceof Error ? serializeError(error.cause) : undefined
    };
}

/**
 * Validate message structure
 */
export function isValidMessage(msg: any): msg is WorkerMessage {
    return (
        msg !== null &&
        typeof msg === 'object' &&
        typeof msg.type === 'string' &&
        typeof msg.timestamp === 'number' &&
        Object.values(WorkerMessageType).includes(msg.type as WorkerMessageType)
    );
}

/**
 * Type guard for START message
 */
export function isStartMessage(msg: WorkerMessage): msg is StartMessage {
    return msg.type === WorkerMessageType.START;
}

/**
 * Type guard for SUCCESS message
 */
export function isSuccessMessage(msg: WorkerMessage): msg is SuccessMessage {
    return msg.type === WorkerMessageType.SUCCESS;
}

/**
 * Type guard for FAILURE message
 */
export function isFailureMessage(msg: WorkerMessage): msg is FailureMessage {
    return msg.type === WorkerMessageType.FAILURE;
}

/**
 * Type guard for PROGRESS message
 */
export function isProgressMessage(msg: WorkerMessage): msg is ProgressMessage {
    return msg.type === WorkerMessageType.PROGRESS;
}

/**
 * Type guard for READY message
 */
export function isReadyMessage(msg: WorkerMessage): msg is ReadyMessage {
    return msg.type === WorkerMessageType.READY;
}

/**
 * Type guard for PONG message
 */
export function isPongMessage(msg: WorkerMessage): msg is PongMessage {
    return msg.type === WorkerMessageType.PONG;
}
