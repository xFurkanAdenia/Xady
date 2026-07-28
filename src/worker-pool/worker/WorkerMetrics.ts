/**
 * WorkerMetrics - Per-worker metrics tracking
 */

import { WorkerMetricsSnapshot } from '../types';
import * as os from 'os';

/**
 * WorkerMetrics tracks metrics for a single worker
 */
export class WorkerMetrics {
    readonly #workerId: string;
    readonly #createdAt: number;

    #cpuUsage = 0;
    #memoryUsage = 0;
    #heapUsage = 0;
    #eventLoopDelay = 0;
    #taskCount = 0;
    #lastUpdate = 0;

    constructor(workerId: string) {
        this.#workerId = workerId;
        this.#createdAt = Date.now();
        this.#lastUpdate = Date.now();
    }

    /**
     * Update metrics
     */
    public update(snapshot: WorkerMetricsSnapshot): void {
        this.#cpuUsage = snapshot.cpuUsage;
        this.#memoryUsage = snapshot.memoryUsage.rss;
        this.#heapUsage = snapshot.heapUsage.used;
        this.#eventLoopDelay = snapshot.eventLoopDelay;
        this.#taskCount = snapshot.taskCount;
        this.#lastUpdate = Date.now();
    }

    /**
     * Get current CPU usage (0-100)
     */
    public get cpuUsage(): number {
        return this.#cpuUsage;
    }

    /**
     * Get current memory usage in bytes
     */
    public get memoryUsage(): number {
        return this.#memoryUsage;
    }

    /**
     * Get heap usage in bytes
     */
    public get heapUsage(): number {
        return this.#heapUsage;
    }

    /**
     * Get event loop delay in milliseconds
     */
    public get eventLoopDelay(): number {
        return this.#eventLoopDelay;
    }

    /**
     * Get total task count
     */
    public get taskCount(): number {
        return this.#taskCount;
    }

    /**
     * Get uptime in milliseconds
     */
    public get uptime(): number {
        return Date.now() - this.#createdAt;
    }

    /**
     * Get time since last update
     */
    public get timeSinceUpdate(): number {
        return Date.now() - this.#lastUpdate;
    }

    /**
     * Check if metrics are stale
     */
    public isStale(threshold: number = 10000): boolean {
        return this.timeSinceUpdate > threshold;
    }

    /**
     * Increment task count
     */
    public incrementTaskCount(): void {
        this.#taskCount++;
    }

    /**
     * Get snapshot
     */
    public getSnapshot(): {
        workerId: string;
        cpuUsage: number;
        memoryUsage: number;
        heapUsage: number;
        eventLoopDelay: number;
        taskCount: number;
        uptime: number;
        lastUpdate: number;
    } {
        return {
            workerId: this.#workerId,
            cpuUsage: this.#cpuUsage,
            memoryUsage: this.#memoryUsage,
            heapUsage: this.#heapUsage,
            eventLoopDelay: this.#eventLoopDelay,
            taskCount: this.#taskCount,
            uptime: this.uptime,
            lastUpdate: this.#lastUpdate
        };
    }

    /**
     * Reset metrics
     */
    public reset(): void {
        this.#cpuUsage = 0;
        this.#memoryUsage = 0;
        this.#heapUsage = 0;
        this.#eventLoopDelay = 0;
        this.#lastUpdate = Date.now();
    }
}
