/**
 * TaskContext - Execution context provided to task handlers
 */

import { TaskContext as ITaskContext } from '../types';

/**
 * Implementation of TaskContext
 */
export class TaskContextImpl implements ITaskContext {
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #workerId: string;
    readonly #threadId: number;
    readonly #createdAt: number;
    readonly #startedAt: number;
    readonly #signal: AbortSignal;
    readonly #data = new Map<string, any>();
    readonly #progressCallback?: (progress: any) => void;
    readonly #logCallback?: (level: string, message: string, data?: any) => void;

    #lastProgressTime = 0;
    #progressThrottle = 100; // Default 100ms throttle

    constructor(config: {
        taskId: string;
        taskName: string;
        workerId: string;
        threadId: number;
        createdAt: number;
        startedAt: number;
        signal: AbortSignal;
        progressCallback?: (progress: any) => void;
        logCallback?: (level: string, message: string, data?: any) => void;
        progressThrottle?: number;
    }) {
        this.#taskId = config.taskId;
        this.#taskName = config.taskName;
        this.#workerId = config.workerId;
        this.#threadId = config.threadId;
        this.#createdAt = config.createdAt;
        this.#startedAt = config.startedAt;
        this.#signal = config.signal;
        this.#progressCallback = config.progressCallback;
        this.#logCallback = config.logCallback;
        if (config.progressThrottle !== undefined) {
            this.#progressThrottle = config.progressThrottle;
        }
    }

    public get taskId(): string {
        return this.#taskId;
    }

    public get taskName(): string {
        return this.#taskName;
    }

    public get workerId(): string {
        return this.#workerId;
    }

    public get threadId(): number {
        return this.#threadId;
    }

    public get createdAt(): number {
        return this.#createdAt;
    }

    public get startedAt(): number {
        return this.#startedAt;
    }

    public get executionTime(): number {
        return Date.now() - this.#startedAt;
    }

    public get signal(): AbortSignal {
        return this.#signal;
    }

    public get data(): Map<string, any> {
        return this.#data;
    }

    /**
     * Report progress (throttled to prevent spam)
     */
    public progress(progressData: any): void {
        if (!this.#progressCallback) {
            return;
        }

        const now = Date.now();
        if (now - this.#lastProgressTime < this.#progressThrottle) {
            return;
        }

        this.#lastProgressTime = now;
        this.#progressCallback(progressData);
    }

    /**
     * Report progress immediately (bypass throttle)
     */
    public progressImmediate(progressData: any): void {
        if (this.#progressCallback) {
            this.#lastProgressTime = Date.now();
            this.#progressCallback(progressData);
        }
    }

    /**
     * Log a message
     */
    public log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
        if (this.#logCallback) {
            this.#logCallback(level, message, data);
        }
    }

    /**
     * Set progress throttle interval
     */
    public setProgressThrottle(ms: number): void {
        this.#progressThrottle = Math.max(0, ms);
    }

    /**
     * Check if task is cancelled
     */
    public isCancelled(): boolean {
        return this.#signal.aborted;
    }

    /**
     * Throw if cancelled
     */
    public throwIfCancelled(): void {
        if (this.#signal.aborted) {
            throw new Error('Task was cancelled');
        }
    }
}
