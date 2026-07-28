/**
 * WorkerFactory - Creates worker instances
 */

import { Worker } from 'worker_threads';
import { WorkerThread } from './WorkerThread';
import { WorkerInitializationException } from '../exceptions';
import * as path from 'path';

/**
 * WorkerFactory creates and initializes workers
 */
export class WorkerFactory {
    readonly #workerPath: string;
    #nextId = 0;

    constructor(workerPath?: string) {
        this.#workerPath = workerPath || this.resolveDefaultWorkerPath();
    }

    /**
     * Create a new worker
     */
    public create(): WorkerThread {
        const id = `worker_${this.#nextId++}`;

        try {
            const worker = new Worker(this.#workerPath, {
                workerData: { workerId: id }
            });

            const workerThread = new WorkerThread(id, worker);
            return workerThread;
        } catch (error) {
            throw new WorkerInitializationException(
                this.#workerPath,
                'Failed to create worker',
                error as Error,
                id
            );
        }
    }

    /**
     * Resolve default worker script path
     */
    private resolveDefaultWorkerPath(): string {
        try {
            return require.resolve('../../workers/worker.js');
        } catch {
            return path.join(__dirname, '../../workers/worker.js');
        }
    }

    /**
     * Get worker path
     */
    public get workerPath(): string {
        return this.#workerPath;
    }

    /**
     * Reset ID counter
     */
    public resetIdCounter(): void {
        this.#nextId = 0;
    }
}
