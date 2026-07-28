/**
 * WorkerPool - Legacy wrapper for backward compatibility
 * 
 * This file maintains the old API while delegating to the new worker pool system.
 */

import { WorkerPool as NewWorkerPool } from '../worker-pool';
import { TaskPriority as NewTaskPriority } from '../worker-pool/types';
import chalk from "chalk";

/**
 * Legacy TaskPriority enum (kept for backward compatibility)
 */
export enum TaskPriority {
    HIGH = 2,
    NORMAL = 1,
    LOW = 0
}

/**
 * Map legacy priority to new priority
 */
function mapPriority(legacy: TaskPriority): NewTaskPriority {
    switch (legacy) {
        case TaskPriority.HIGH:
            return NewTaskPriority.HIGH;
        case TaskPriority.LOW:
            return NewTaskPriority.LOW;
        case TaskPriority.NORMAL:
        default:
            return NewTaskPriority.NORMAL;
    }
}

/**
 * WorkerPool - Backward compatible wrapper
 */
export class WorkerPool {
    private static instance: WorkerPool;
    private pool: NewWorkerPool;
    private isEnabled = false;

    private constructor() {
        this.pool = NewWorkerPool.getInstance();
    }

    public static getInstance(): WorkerPool {
        if (!WorkerPool.instance) {
            WorkerPool.instance = new WorkerPool();
        }
        return WorkerPool.instance;
    }

    public init(enabled: boolean, maxWorkers: number, cpuAffinity: string): void {
        this.isEnabled = enabled;

        if (!enabled) {
            console.log(chalk.yellow("[WorkerPool] Ayarlardan kapalı olduğu için başlatılmadı. Tüm işlemler ana thread (Event Loop) üzerinde çalışacak."));
            return;
        }

        this.pool.init(enabled, maxWorkers, cpuAffinity);
        console.log(chalk.green(`[WorkerPool] Aktifleştirildi. ${maxWorkers} iş parçacığı arka planda çalışıyor.`));
    }

    public execute<T>(
        fn: (...args: any[]) => T | Promise<T>,
        args: any[],
        priority: TaskPriority = TaskPriority.NORMAL,
        signal?: AbortSignal,
        onProgress?: (progress: any) => void
    ): Promise<T> {
        return this.pool.execute(
            fn as any,
            args,
            mapPriority(priority),
            signal,
            onProgress
        );
    }

    public cancelTask(id: string, reason: string = "Görev iptal edildi."): boolean {
        return this.pool.cancelTask(id, reason);
    }

    public shutdown(): void {
        this.pool.shutdown();
    }

    /**
     * Get the new pool instance for advanced features
     */
    public getAdvancedPool(): NewWorkerPool {
        return this.pool;
    }
}
