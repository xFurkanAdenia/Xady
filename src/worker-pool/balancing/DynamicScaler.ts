/**
 * DynamicScaler - Auto-scaling for worker pool
 */

import { WorkerRegistry } from '../worker/WorkerRegistry';
import { TaskQueue } from '../task/TaskQueue';
import { EventEmitter } from 'events';

/**
 * DynamicScaler manages automatic worker scaling
 */
export class DynamicScaler extends EventEmitter {
    readonly #registry: WorkerRegistry;
    readonly #queue: TaskQueue;
    readonly #minWorkers: number;
    readonly #maxWorkers: number;
    readonly #scaleUpThreshold: number;
    readonly #scaleDownThreshold: number;
    readonly #idleTimeout: number;

    #enabled = false;
    #checkInterval: NodeJS.Timeout | null = null;

    constructor(config: {
        registry: WorkerRegistry;
        queue: TaskQueue;
        minWorkers: number;
        maxWorkers: number;
        scaleUpThreshold?: number;
        scaleDownThreshold?: number;
        idleTimeout?: number;
    }) {
        super();
        this.#registry = config.registry;
        this.#queue = config.queue;
        this.#minWorkers = config.minWorkers;
        this.#maxWorkers = config.maxWorkers;
        this.#scaleUpThreshold = config.scaleUpThreshold ?? 5;
        this.#scaleDownThreshold = config.scaleDownThreshold ?? 0;
        this.#idleTimeout = config.idleTimeout ?? 60000;
    }

    /**
     * Enable dynamic scaling
     */
    public enable(): void {
        if (this.#enabled) return;

        this.#enabled = true;
        this.#checkInterval = setInterval(() => this.check(), 5000);
    }

    /**
     * Disable dynamic scaling
     */
    public disable(): void {
        if (!this.#enabled) return;

        this.#enabled = false;
        if (this.#checkInterval) {
            clearInterval(this.#checkInterval);
            this.#checkInterval = null;
        }
    }

    /**
     * Check if scaling is needed
     */
    private check(): void {
        const workerCount = this.#registry.size;
        const queueSize = this.#queue.size;
        const availableWorkers = this.#registry.getAvailable().length;

        if (queueSize > this.#scaleUpThreshold && workerCount < this.#maxWorkers && availableWorkers === 0) {
            const needed = Math.min(
                Math.ceil(queueSize / this.#scaleUpThreshold),
                this.#maxWorkers - workerCount
            );
            this.emit('scaleUp', needed);
        }

        if (queueSize <= this.#scaleDownThreshold && workerCount > this.#minWorkers) {
            const idleWorkers = this.findIdleWorkers();
            if (idleWorkers.length > 0) {
                const canRemove = Math.min(idleWorkers.length, workerCount - this.#minWorkers);
                this.emit('scaleDown', idleWorkers.slice(0, canRemove).map(w => w.id));
            }
        }
    }

    /**
     * Find idle workers
     */
    private findIdleWorkers(): Array<{id: string; idleTime: number}> {
        const now = Date.now();
        return this.#registry.getAvailable()
            .map(w => ({
                id: w.id,
                idleTime: now - w.lastActiveAt
            }))
            .filter(w => w.idleTime > this.#idleTimeout)
            .sort((a, b) => b.idleTime - a.idleTime);
    }

    /**
     * Get scaling info
     */
    public getInfo(): {
        enabled: boolean;
        currentWorkers: number;
        minWorkers: number;
        maxWorkers: number;
        queueSize: number;
        availableWorkers: number;
    } {
        return {
            enabled: this.#enabled,
            currentWorkers: this.#registry.size,
            minWorkers: this.#minWorkers,
            maxWorkers: this.#maxWorkers,
            queueSize: this.#queue.size,
            availableWorkers: this.#registry.getAvailable().length
        };
    }
}
