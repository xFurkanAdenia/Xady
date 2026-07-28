/**
 * WorkerThread - Wrapper around Worker with state management
 */

import { Worker } from 'worker_threads';
import { WorkerState, isValidWorkerTransition, WorkerInfo } from '../types';
import { WorkerMetrics } from './WorkerMetrics';
import { WorkerProtocol } from './WorkerProtocol';
import { WorkerCrashException } from '../exceptions';
import { EventEmitter } from 'events';

/**
 * WorkerThread manages a single worker thread
 */
export class WorkerThread extends EventEmitter {
    readonly #id: string;
    readonly #worker: Worker;
    readonly #metrics: WorkerMetrics;
    readonly #protocol: WorkerProtocol;
    readonly #createdAt: number;

    #state: WorkerState = WorkerState.CREATED;
    #threadId: number = 0;
    #currentTaskId: string | null = null;
    #lastActiveAt: number;
    #crashCount = 0;

    constructor(id: string, worker: Worker) {
        super();
        this.#id = id;
        this.#worker = worker;
        this.#metrics = new WorkerMetrics(id);
        this.#protocol = new WorkerProtocol(id);
        this.#createdAt = Date.now();
        this.#lastActiveAt = Date.now();
    }

    /**
     * Get worker ID
     */
    public get id(): string {
        return this.#id;
    }

    /**
     * Get native Worker instance
     */
    public get worker(): Worker {
        return this.#worker;
    }

    /**
     * Get current state
     */
    public get state(): WorkerState {
        return this.#state;
    }

    /**
     * Get thread ID
     */
    public get threadId(): number {
        return this.#threadId;
    }

    /**
     * Set thread ID
     */
    public setThreadId(id: number): void {
        this.#threadId = id;
    }

    /**
     * Get current task ID
     */
    public get currentTaskId(): string | null {
        return this.#currentTaskId;
    }

    /**
     * Set current task ID
     */
    public setCurrentTaskId(taskId: string | null): void {
        this.#currentTaskId = taskId;
        if (taskId !== null) {
            this.#lastActiveAt = Date.now();
            this.#metrics.incrementTaskCount();
        }
    }

    /**
     * Get metrics
     */
    public get metrics(): WorkerMetrics {
        return this.#metrics;
    }

    /**
     * Get protocol handler
     */
    public get protocol(): WorkerProtocol {
        return this.#protocol;
    }

    /**
     * Get uptime
     */
    public get uptime(): number {
        return Date.now() - this.#createdAt;
    }

    /**
     * Get last active timestamp
     */
    public get lastActiveAt(): number {
        return this.#lastActiveAt;
    }

    /**
     * Get crash count
     */
    public get crashCount(): number {
        return this.#crashCount;
    }

    /**
     * Change state
     */
    public changeState(newState: WorkerState, reason?: string): boolean {
        if (this.#state === newState) {
            return false;
        }

        if (!isValidWorkerTransition(this.#state, newState)) {
            return false;
        }

        const oldState = this.#state;
        this.#state = newState;

        this.emit('stateChange', {
            workerId: this.#id,
            oldState,
            newState,
            reason
        });

        return true;
    }

    /**
     * Mark as crashed
     */
    public markCrashed(exitCode: number, error?: Error): void {
        this.#crashCount++;
        this.changeState(WorkerState.CRASHED, `Exit code: ${exitCode}`);
        
        this.emit('crashed', new WorkerCrashException(
            this.#id,
            exitCode,
            WorkerState[this.#state],
            error?.message,
            error
        ));
    }

    /**
     * Check if worker is available
     */
    public isAvailable(): boolean {
        return this.#state === WorkerState.READY && this.#currentTaskId === null;
    }

    /**
     * Check if worker is busy
     */
    public isBusy(): boolean {
        return this.#state === WorkerState.BUSY || this.#currentTaskId !== null;
    }

    /**
     * Check if worker is terminal state
     */
    public isTerminal(): boolean {
        return this.#state === WorkerState.STOPPED || 
               this.#state === WorkerState.CRASHED || 
               this.#state === WorkerState.DISPOSED;
    }

    /**
     * Post message to worker
     */
    public postMessage(message: any): void {
        this.#worker.postMessage(message);
    }

    /**
     * Terminate worker
     */
    public async terminate(): Promise<number> {
        this.changeState(WorkerState.STOPPING, 'Terminate requested');
        const exitCode = await this.#worker.terminate();
        this.changeState(WorkerState.STOPPED, `Terminated with code ${exitCode}`);
        return exitCode;
    }

    /**
     * Get worker info
     */
    public getInfo(): WorkerInfo {
        return {
            id: this.#id,
            threadId: this.#threadId,
            state: this.#state,
            currentTaskId: this.#currentTaskId,
            cpuUsage: this.#metrics.cpuUsage,
            memoryUsage: this.#metrics.memoryUsage,
            taskCount: this.#metrics.taskCount,
            createdAt: this.#createdAt,
            lastActiveAt: this.#lastActiveAt,
            uptime: this.uptime,
            crashCount: this.#crashCount
        };
    }
}
