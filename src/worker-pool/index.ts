/**
 * Worker Pool System - Public exports
 */

// Main entry point
export { WorkerPool } from './WorkerPool';

// Types
export {
    WorkerState,
    TaskState,
    TaskPriority,
    LoadBalancingStrategy,
    WorkerMessageType,
    isValidWorkerTransition,
    isTerminalWorkerState,
    isActiveWorkerState,
    isWorkerAvailable,
    isValidTaskTransition,
    isTerminalTaskState,
    isActiveTaskState,
    isTaskCancellable,
    isTaskRetryable
} from './types';

export type {
    WorkerInfo,
    TaskInfo,
    TaskContext,
    TaskHandler,
    TaskDescriptor,
    TaskSubmitOptions,
    TaskResult,
    RetryPolicy,
    WorkerPoolConfig,
    WorkerPoolMetrics,
    WorkerMessage,
    WorkerMetricsSnapshot
} from './types';

// Exceptions
export {
    WorkerPoolException,
    WorkerCrashException,
    TaskTimeoutException,
    TaskCancelledException,
    SerializationException,
    WorkerInitializationException,
    TaskExecutionException,
    WorkerProtocolException,
    TaskNotFoundException,
    DuplicateTaskException,
    WorkerPoolShutdownException
} from './exceptions';

// Task system
export { TaskRegistry, TaskRetryPolicy, TaskStatistics } from './task';

// Worker system
export { WorkerFactory, WorkerRegistry, WorkerThread, WorkerSerializer } from './worker';

// Balancing
export { LoadBalancer, DynamicScaler } from './balancing';
