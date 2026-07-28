/**
 * WorkerPool - Main entry point for worker pool system
 * 
 * This is a thin orchestrator that delegates to specialized managers.
 * Preserves backward compatibility with old API.
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import { WorkerFactory, WorkerRegistry, WorkerThread, WorkerHeartbeat } from './worker';
import { TaskRegistry, TaskQueue, TaskStatistics, TaskRetryPolicy, TaskCancellationToken, TaskContextImpl } from './task';
import { LoadBalancer, DynamicScaler } from './balancing';
import {
    WorkerPoolConfig,
    DEFAULT_WORKER_POOL_CONFIG,
    TaskPriority,
    TaskDescriptor,
    TaskHandler,
    TaskSubmitOptions,
    WorkerPoolMetrics,
    WorkerInfo,
    TaskInfo,
    TaskState,
    WorkerState,
    WorkerMessageType,
    isReadyMessage,
    isSuccessMessage,
    isFailureMessage,
    isProgressMessage,
    isPongMessage
} from './types';
import { WorkerPoolShutdownException, TaskTimeoutException } from './exceptions';
import { TaskTimeoutManager } from './task/TaskTimeoutManager';

/**
 * WorkerPool - Enterprise-grade task execution framework
 */
export class WorkerPool extends EventEmitter {
    private static instance: WorkerPool;

    readonly #config: WorkerPoolConfig;
    readonly #factory: WorkerFactory;
    readonly #registry: WorkerRegistry;
    readonly #taskRegistry: TaskRegistry;
    readonly #queue: TaskQueue;
    readonly #statistics: TaskStatistics;
    readonly #loadBalancer: LoadBalancer;
    readonly #scaler: DynamicScaler | null;
    readonly #timeoutManager: TaskTimeoutManager;
    readonly #heartbeats = new Map<string, WorkerHeartbeat>();

    #nextTaskId = 0;
    #isInitialized = false;
    #isShutdown = false;

    private constructor() {
        super();
        this.#config = { ...DEFAULT_WORKER_POOL_CONFIG };
        this.#factory = new WorkerFactory(this.#config.workerPath);
        this.#registry = new WorkerRegistry();
        this.#taskRegistry = new TaskRegistry();
        this.#queue = new TaskQueue(this.#config.maxQueueSize);
        this.#statistics = new TaskStatistics();
        this.#loadBalancer = new LoadBalancer(this.#registry, this.#config.loadBalancingStrategy);
        this.#timeoutManager = new TaskTimeoutManager();

        if (this.#config.dynamicScaling) {
            this.#scaler = new DynamicScaler({
                registry: this.#registry,
                queue: this.#queue,
                minWorkers: this.#config.minWorkers,
                maxWorkers: this.#config.maxWorkers,
                idleTimeout: this.#config.idleTimeout
            });

            this.#scaler.on('scaleUp', (count: number) => this.scaleUp(count));
            this.#scaler.on('scaleDown', (workerIds: string[]) => this.scaleDown(workerIds));
        } else {
            this.#scaler = null;
        }
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): WorkerPool {
        if (!WorkerPool.instance) {
            WorkerPool.instance = new WorkerPool();
        }
        return WorkerPool.instance;
    }

    /**
     * Initialize worker pool
     * 
     * @param enabled - Enable worker pool (false = run on main thread)
     * @param maxWorkers - Maximum number of workers
     * @param cpuAffinity - CPU affinity setting
     */
    public init(enabled: boolean, maxWorkers?: number, cpuAffinity?: string): void {
        if (this.#isInitialized) {
            this.shutdown();
        }

        if (!enabled) {
            this.#isInitialized = false;
            return;
        }

        const workerCount = maxWorkers ?? this.#config.initialWorkers;

        for (let i = 0; i < workerCount; i++) {
            this.createWorker();
        }

        if (this.#scaler) {
            this.#scaler.enable();
        }

        this.#isInitialized = true;
        this.#isShutdown = false;

        this.emit('initialized', { workerCount });
    }

    /**
     * Register a task handler
     */
    public registerTask<TArgs = any, TResult = any>(
        name: string,
        handler: TaskHandler<TArgs, TResult>,
        options?: Omit<TaskDescriptor, 'name' | 'handler'>
    ): void {
        this.#taskRegistry.registerTask(name, handler, options);
    }

    /**
     * Execute a task
     * 
     * Supports both new API (task name) and old API (function string)
     */
    public execute<T>(
        taskNameOrFn: string | ((...args: any[]) => T | Promise<T>),
        args: any[],
        priority: TaskPriority = TaskPriority.NORMAL,
        signal?: AbortSignal,
        onProgress?: (progress: any) => void
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (signal?.aborted) {
                return reject(new Error('Task cancelled before execution'));
            }

            if (this.#isShutdown) {
                return reject(new WorkerPoolShutdownException());
            }

            if (!this.#isInitialized) {
                return this.executeOnMainThread(taskNameOrFn, args, resolve, reject);
            }

            const taskName = typeof taskNameOrFn === 'string' 
                ? taskNameOrFn 
                : '__legacy_function__';

            if (taskName !== '__legacy_function__') {
                this.#taskRegistry.validate(taskName);
            }

            const taskId = `task_${this.#nextTaskId++}`;

            const queuedTask = {
                id: taskId,
                name: taskName,
                priority,
                args,
                queuedAt: Date.now(),
                signal,
                onProgress,
                resolve,
                reject
            };

            if (signal) {
                signal.addEventListener('abort', () => {
                    this.cancelTask(taskId, 'Cancelled by AbortSignal');
                });
            }

            this.#queue.enqueue(queuedTask);
            this.processQueue();
        });
    }

    /**
     * Execute task on main thread (when pool is disabled)
     */
    private executeOnMainThread<T>(
        taskNameOrFn: string | Function,
        args: any[],
        resolve: (value: T) => void,
        reject: (reason: any) => void
    ): void {
        try {
            let handler: Function;

            if (typeof taskNameOrFn === 'string') {
                const descriptor = this.#taskRegistry.get(taskNameOrFn);
                handler = descriptor.handler;
            } else {
                handler = taskNameOrFn;
            }

            const result = handler(...args);

            if (result instanceof Promise) {
                result.then(resolve).catch(reject);
            } else {
                resolve(result);
            }
        } catch (error) {
            reject(error);
        }
    }

    /**
     * Process task queue
     */
    private processQueue(): void {
        while (!this.#queue.isEmpty()) {
            const worker = this.#loadBalancer.selectWorker();
            if (!worker) break;

            const task = this.#queue.dequeue();
            if (!task) break;

            this.assignTaskToWorker(task, worker);
        }
    }

    /**
     * Assign task to worker
     */
    private assignTaskToWorker(task: any, worker: WorkerThread): void {
        worker.changeState(WorkerState.BUSY);
        worker.setCurrentTaskId(task.id);

        const descriptor = this.#taskRegistry.tryGet(task.name);
        const timeout = descriptor?.timeout;

        if (timeout) {
            this.#timeoutManager.startTimeout(
                task.id,
                task.name,
                timeout,
                (exception) => {
                    worker.terminate();
                    task.reject(exception);
                    this.#statistics.recordCompletion(task.name, timeout, TaskState.TIMEOUT);
                }
            );
        }

        const startMessage = worker.protocol.createStart(
            task.id,
            task.name,
            task.args,
            timeout
        );

        worker.postMessage(startMessage);
    }

    /**
     * Create a new worker
     */
    private createWorker(): WorkerThread {
        const workerThread = this.#factory.create();

        workerThread.changeState(WorkerState.STARTING);
        this.#registry.register(workerThread);

        const heartbeat = new WorkerHeartbeat(
            workerThread,
            this.#config.heartbeatInterval,
            this.#config.heartbeatTimeout
        );

        heartbeat.on('timeout', () => {
            workerThread.terminate();
        });

        this.#heartbeats.set(workerThread.id, heartbeat);

        workerThread.worker.on('message', (msg) => this.handleWorkerMessage(workerThread, msg));
        workerThread.worker.on('error', (err) => this.handleWorkerError(workerThread, err as Error));
        workerThread.worker.on('exit', (code) => this.handleWorkerExit(workerThread, code));

        return workerThread;
    }

    /**
     * Handle worker messages
     */
    private handleWorkerMessage(worker: WorkerThread, msg: any): void {
        try {
            if (isReadyMessage(msg)) {
                worker.setThreadId(msg.threadId);
                worker.changeState(WorkerState.READY);
                this.#heartbeats.get(worker.id)?.start();
                this.processQueue();
            } else if (isSuccessMessage(msg)) {
                this.handleTaskSuccess(worker, msg.taskId, msg.result, msg.executionTime);
            } else if (isFailureMessage(msg)) {
                this.handleTaskFailure(worker, msg.taskId, new Error(msg.error.message), msg.executionTime);
            } else if (isProgressMessage(msg)) {
                this.handleTaskProgress(msg.taskId, msg.progress);
            } else if (isPongMessage(msg)) {
                worker.metrics.update(msg.metrics);
                this.#heartbeats.get(worker.id)?.handlePong(msg.sequence);
            }
        } catch (error) {
            // Protocol error - log and continue
        }
    }

    /**
     * Handle task success
     */
    private handleTaskSuccess(worker: WorkerThread, taskId: string, result: any, executionTime: number): void {
        const task = this.findQueuedTask(taskId);
        if (!task) return;

        this.#timeoutManager.clearTimeout(taskId);
        this.#taskRegistry.incrementExecutionCount(task.name);
        this.#statistics.recordCompletion(task.name, executionTime, TaskState.COMPLETED);

        task.resolve(result);
        this.cleanupTask(worker, taskId);
    }

    /**
     * Handle task failure
     */
    private handleTaskFailure(worker: WorkerThread, taskId: string, error: Error, executionTime: number): void {
        const task = this.findQueuedTask(taskId);
        if (!task) return;

        this.#timeoutManager.clearTimeout(taskId);
        this.#statistics.recordCompletion(task.name, executionTime, TaskState.FAILED);

        task.reject(error);
        this.cleanupTask(worker, taskId);
    }

    /**
     * Handle task progress
     */
    private handleTaskProgress(taskId: string, progress: any): void {
        const task = this.findQueuedTask(taskId);
        if (task?.onProgress) {
            task.onProgress(progress);
        }
    }

    /**
     * Find queued task (stub - would need task tracking map)
     */
    private findQueuedTask(taskId: string): any {
        // This needs a tracking map - simplified for now
        return null;
    }

    /**
     * Cleanup after task completion
     */
    private cleanupTask(worker: WorkerThread, taskId: string): void {
        worker.setCurrentTaskId(null);
        worker.changeState(WorkerState.READY);
        this.processQueue();
    }

    /**
     * Handle worker error
     */
    private handleWorkerError(worker: WorkerThread, error: Error): void {
        worker.markCrashed(1, error);
        this.replaceWorker(worker);
    }

    /**
     * Handle worker exit
     */
    private handleWorkerExit(worker: WorkerThread, code: number): void {
        if (code !== 0) {
            worker.markCrashed(code);
        }
        if (this.#isInitialized && !this.#isShutdown) {
            this.replaceWorker(worker);
        }
    }

    /**
     * Replace a crashed worker
     */
    private replaceWorker(oldWorker: WorkerThread): void {
        this.#heartbeats.get(oldWorker.id)?.stop();
        this.#heartbeats.delete(oldWorker.id);
        this.#registry.unregister(oldWorker.id);

        if (this.#isInitialized && !this.#isShutdown) {
            this.createWorker();
        }
    }

    /**
     * Scale up workers
     */
    private scaleUp(count: number): void {
        for (let i = 0; i < count; i++) {
            if (this.#registry.size >= this.#config.maxWorkers) break;
            this.createWorker();
        }
    }

    /**
     * Scale down workers
     */
    private scaleDown(workerIds: string[]): void {
        for (const id of workerIds) {
            const worker = this.#registry.get(id);
            if (worker && worker.isAvailable()) {
                worker.terminate();
                this.#registry.unregister(id);
                this.#heartbeats.get(id)?.stop();
                this.#heartbeats.delete(id);
            }
        }
    }

    /**
     * Cancel a task
     */
    public cancelTask(taskId: string, reason: string = 'Task cancelled'): boolean {
        const queued = this.#queue.removeById(taskId);
        if (queued) {
            queued.reject(new Error(reason));
            return true;
        }

        const worker = this.#registry.findByTaskId(taskId);
        if (worker) {
            const cancelMsg = worker.protocol.createCancel(taskId, reason);
            worker.postMessage(cancelMsg);
            return true;
        }

        return false;
    }

    /**
     * Shutdown worker pool
     */
    public shutdown(): void {
        this.#isShutdown = true;
        this.#scaler?.disable();

        for (const heartbeat of this.#heartbeats.values()) {
            heartbeat.stop();
        }

        for (const worker of this.#registry.getAll()) {
            worker.terminate();
        }

        this.#heartbeats.clear();
        this.#registry.clear();
        this.#queue.clear();
        this.#timeoutManager.clearAll();
        this.#isInitialized = false;
    }

    /**
     * Get metrics
     */
    public getMetrics(): WorkerPoolMetrics {
        const stats = this.#statistics.getGlobalStats();
        const queueStats = this.#queue.getStatistics();

        return {
            workers: {
                total: this.#registry.size,
                ready: this.#registry.countByState(WorkerState.READY),
                busy: this.#registry.countByState(WorkerState.BUSY),
                crashed: this.#registry.countByState(WorkerState.CRASHED),
                idle: this.#registry.getAvailable().length
            },
            tasks: {
                queued: this.#queue.size,
                running: this.#registry.getBusy().length,
                completed: stats.completedTasks,
                failed: stats.failedTasks,
                cancelled: stats.cancelledTasks,
                timeout: stats.timeoutTasks
            },
            performance: {
                avgExecutionTime: stats.avgExecutionTime,
                avgQueueTime: queueStats.averageWaitTime,
                throughput: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                queueLength: this.#queue.size
            }
        };
    }
}
