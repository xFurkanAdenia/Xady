/**
 * WorkerRegistry - Tracks all workers
 */

import { WorkerThread } from './WorkerThread';
import { WorkerState } from '../types';

/**
 * WorkerRegistry manages worker tracking
 */
export class WorkerRegistry {
    readonly #workers = new Map<string, WorkerThread>();

    /**
     * Register a worker
     */
    public register(worker: WorkerThread): void {
        this.#workers.set(worker.id, worker);
    }

    /**
     * Unregister a worker
     */
    public unregister(workerId: string): boolean {
        return this.#workers.delete(workerId);
    }

    /**
     * Get a worker by ID
     */
    public get(workerId: string): WorkerThread | undefined {
        return this.#workers.get(workerId);
    }

    /**
     * Check if worker exists
     */
    public has(workerId: string): boolean {
        return this.#workers.has(workerId);
    }

    /**
     * Get all workers
     */
    public getAll(): WorkerThread[] {
        return Array.from(this.#workers.values());
    }

    /**
     * Get workers by state
     */
    public getByState(state: WorkerState): WorkerThread[] {
        return this.getAll().filter(w => w.state === state);
    }

    /**
     * Get available workers
     */
    public getAvailable(): WorkerThread[] {
        return this.getAll().filter(w => w.isAvailable());
    }

    /**
     * Get busy workers
     */
    public getBusy(): WorkerThread[] {
        return this.getAll().filter(w => w.isBusy());
    }

    /**
     * Get worker count
     */
    public get size(): number {
        return this.#workers.size;
    }

    /**
     * Get count by state
     */
    public countByState(state: WorkerState): number {
        return this.getByState(state).length;
    }

    /**
     * Clear all workers
     */
    public clear(): void {
        this.#workers.clear();
    }

    /**
     * Find worker by task ID
     */
    public findByTaskId(taskId: string): WorkerThread | undefined {
        return this.getAll().find(w => w.currentTaskId === taskId);
    }

    /**
     * Get worker IDs
     */
    public getWorkerIds(): string[] {
        return Array.from(this.#workers.keys());
    }
}
