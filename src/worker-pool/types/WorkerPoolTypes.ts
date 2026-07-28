/**
 * WorkerPoolTypes - Shared types for worker pool system
 */

import { WorkerState } from './WorkerState';
import { TaskState } from './TaskState';

/**
 * Task priority levels
 */
export enum TaskPriority {
    /**
     * Critical priority - executed before all others
     */
    CRITICAL = 4,

    /**
     * High priority - executed before normal tasks
     */
    HIGH = 3,

    /**
     * Normal priority - default
     */
    NORMAL = 2,

    /**
     * Low priority - executed when no higher priority tasks are available
     */
    LOW = 1,

    /**
     * Idle priority - executed only when all other tasks are complete
     */
    IDLE = 0
}

/**
 * Task context provided to task handlers
 */
export interface TaskContext {
    /**
     * Unique task ID
     */
    readonly taskId: string;

    /**
     * Task name
     */
    readonly taskName: string;

    /**
     * Worker ID executing this task
     */
    readonly workerId: string;

    /**
     * Worker thread ID
     */
    readonly threadId: number;

    /**
     * Task creation timestamp
     */
    readonly createdAt: number;

    /**
     * Task started timestamp
     */
    readonly startedAt: number;

    /**
     * Current execution time in milliseconds
     */
    readonly executionTime: number;

    /**
     * Cancellation signal
     */
    readonly signal: AbortSignal;

    /**
     * Report progress
     */
    progress(data: any): void;

    /**
     * Log a message
     */
    log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void;

    /**
     * Custom data storage
     */
    readonly data: Map<string, any>;
}

/**
 * Task handler function
 */
export interface TaskHandler<TArgs = any, TResult = any> {
    (args: TArgs, context: TaskContext): Promise<TResult> | TResult;
}

/**
 * Task descriptor
 */
export interface TaskDescriptor<TArgs = any, TResult = any> {
    /**
     * Unique task name
     */
    readonly name: string;

    /**
     * Task handler function
     */
    readonly handler: TaskHandler<TArgs, TResult>;

    /**
     * Default timeout in milliseconds
     */
    readonly timeout?: number;

    /**
     * Default retry policy
     */
    readonly retryPolicy?: RetryPolicy;

    /**
     * Default priority
     */
    readonly priority?: TaskPriority;

    /**
     * Task description
     */
    readonly description?: string;

    /**
     * Task metadata
     */
    readonly metadata?: Record<string, any>;
}

/**
 * Task information
 */
export interface TaskInfo {
    /**
     * Unique task ID
     */
    readonly id: string;

    /**
     * Task name
     */
    readonly name: string;

    /**
     * Current state
     */
    readonly state: TaskState;

    /**
     * Task priority
     */
    readonly priority: TaskPriority;

    /**
     * Worker ID (if assigned)
     */
    readonly workerId: string | null;

    /**
     * Task arguments
     */
    readonly args: any[];

    /**
     * Created timestamp
     */
    readonly createdAt: number;

    /**
     * Started timestamp
     */
    readonly startedAt: number | null;

    /**
     * Completed timestamp
     */
    readonly completedAt: number | null;

    /**
     * Retry count
     */
    readonly retryCount: number;

    /**
     * Timeout duration
     */
    readonly timeout?: number;

    /**
     * Error (if failed)
     */
    readonly error?: Error;
}

/**
 * Worker information
 */
export interface WorkerInfo {
    /**
     * Unique worker ID
     */
    readonly id: string;

    /**
     * Thread ID
     */
    readonly threadId: number;

    /**
     * Current state
     */
    readonly state: WorkerState;

    /**
     * Current task ID (if busy)
     */
    readonly currentTaskId: string | null;

    /**
     * CPU usage percentage (0-100)
     */
    readonly cpuUsage: number;

    /**
     * Memory usage in bytes
     */
    readonly memoryUsage: number;

    /**
     * Total tasks executed
     */
    readonly taskCount: number;

    /**
     * Created timestamp
     */
    readonly createdAt: number;

    /**
     * Last active timestamp
     */
    readonly lastActiveAt: number;

    /**
     * Uptime in milliseconds
     */
    readonly uptime: number;

    /**
     * Crash count
     */
    readonly crashCount: number;
}

/**
 * Retry policy
 */
export interface RetryPolicy {
    /**
     * Maximum retry attempts
     */
    readonly maxRetries: number;

    /**
     * Retry strategy
     */
    readonly strategy: 'fixed' | 'exponential' | 'linear';

    /**
     * Initial delay in milliseconds
     */
    readonly initialDelay: number;

    /**
     * Maximum delay in milliseconds
     */
    readonly maxDelay?: number;

    /**
     * Backoff multiplier (for exponential)
     */
    readonly multiplier?: number;

    /**
     * Jitter factor (0-1) to randomize delay
     */
    readonly jitter?: number;

    /**
     * Retry condition predicate
     */
    readonly retryIf?: (error: Error, attempt: number) => boolean;
}

/**
 * Load balancing strategy
 */
export enum LoadBalancingStrategy {
    /**
     * Select worker with fewest tasks
     */
    LEAST_BUSY = 'LEAST_BUSY',

    /**
     * Round-robin selection
     */
    ROUND_ROBIN = 'ROUND_ROBIN',

    /**
     * Select worker with lowest CPU usage
     */
    CPU_BASED = 'CPU_BASED',

    /**
     * Select worker with lowest RAM usage
     */
    RAM_BASED = 'RAM_BASED',

    /**
     * Random selection
     */
    RANDOM = 'RANDOM'
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
    /**
     * Enable worker pool (false = run on main thread)
     */
    readonly enabled: boolean;

    /**
     * Minimum number of workers
     */
    readonly minWorkers: number;

    /**
     * Maximum number of workers
     */
    readonly maxWorkers: number;

    /**
     * Initial number of workers
     */
    readonly initialWorkers: number;

    /**
     * CPU affinity setting
     */
    readonly cpuAffinity: string;

    /**
     * Idle timeout for workers (milliseconds)
     */
    readonly idleTimeout: number;

    /**
     * Enable dynamic scaling
     */
    readonly dynamicScaling: boolean;

    /**
     * Load balancing strategy
     */
    readonly loadBalancingStrategy: LoadBalancingStrategy;

    /**
     * Heartbeat interval (milliseconds)
     */
    readonly heartbeatInterval: number;

    /**
     * Heartbeat timeout (milliseconds)
     */
    readonly heartbeatTimeout: number;

    /**
     * Maximum task queue size (0 = unlimited)
     */
    readonly maxQueueSize: number;

    /**
     * Enable metrics collection
     */
    readonly enableMetrics: boolean;

    /**
     * Metrics collection interval (milliseconds)
     */
    readonly metricsInterval: number;

    /**
     * Worker script path
     */
    readonly workerPath?: string;
}

/**
 * Worker pool metrics
 */
export interface WorkerPoolMetrics {
    /**
     * Worker statistics
     */
    readonly workers: {
        readonly total: number;
        readonly ready: number;
        readonly busy: number;
        readonly crashed: number;
        readonly idle: number;
    };

    /**
     * Task statistics
     */
    readonly tasks: {
        readonly queued: number;
        readonly running: number;
        readonly completed: number;
        readonly failed: number;
        readonly cancelled: number;
        readonly timeout: number;
    };

    /**
     * Performance statistics
     */
    readonly performance: {
        readonly avgExecutionTime: number;
        readonly avgQueueTime: number;
        readonly throughput: number;
        readonly cpuUsage: number;
        readonly memoryUsage: number;
        readonly queueLength: number;
    };

    /**
     * Historical data
     */
    readonly history?: {
        readonly throughputHistory: number[];
        readonly cpuHistory: number[];
        readonly memoryHistory: number[];
    };
}

/**
 * Task submission options
 */
export interface TaskSubmitOptions {
    /**
     * Task priority
     */
    readonly priority?: TaskPriority;

    /**
     * Cancellation signal
     */
    readonly signal?: AbortSignal;

    /**
     * Progress callback
     */
    readonly onProgress?: (progress: any) => void;

    /**
     * Timeout in milliseconds
     */
    readonly timeout?: number;

    /**
     * Retry policy
     */
    readonly retryPolicy?: RetryPolicy;

    /**
     * Custom metadata
     */
    readonly metadata?: Record<string, any>;
}

/**
 * Task result wrapper
 */
export interface TaskResult<T = any> {
    /**
     * Success flag
     */
    readonly success: boolean;

    /**
     * Result value (if successful)
     */
    readonly value?: T;

    /**
     * Error (if failed)
     */
    readonly error?: Error;

    /**
     * Task ID
     */
    readonly taskId: string;

    /**
     * Task name
     */
    readonly taskName: string;

    /**
     * Worker ID
     */
    readonly workerId: string;

    /**
     * Execution time in milliseconds
     */
    readonly executionTime: number;

    /**
     * Retry count
     */
    readonly retryCount: number;

    /**
     * Completed timestamp
     */
    readonly completedAt: number;
}

/**
 * Default retry policy
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    strategy: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
    jitter: 0.1
};

/**
 * Default worker pool configuration
 */
export const DEFAULT_WORKER_POOL_CONFIG: WorkerPoolConfig = {
    enabled: true,
    minWorkers: 1,
    maxWorkers: Math.max(1, require('os').cpus().length - 1),
    initialWorkers: Math.max(1, Math.floor(require('os').cpus().length / 2)),
    cpuAffinity: 'all',
    idleTimeout: 60000,
    dynamicScaling: true,
    loadBalancingStrategy: LoadBalancingStrategy.LEAST_BUSY,
    heartbeatInterval: 5000,
    heartbeatTimeout: 3000,
    maxQueueSize: 0,
    enableMetrics: true,
    metricsInterval: 1000
};
