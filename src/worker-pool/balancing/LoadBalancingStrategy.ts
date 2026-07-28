/**
 * LoadBalancingStrategy - Worker selection strategies
 */

import { WorkerThread } from '../worker/WorkerThread';

/**
 * Base interface for load balancing strategies
 */
export interface ILoadBalancingStrategy {
    selectWorker(available: WorkerThread[]): WorkerThread | null;
    getName(): string;
}

/**
 * Least Busy Strategy - Select worker with fewest tasks
 */
export class LeastBusyStrategy implements ILoadBalancingStrategy {
    public selectWorker(available: WorkerThread[]): WorkerThread | null {
        if (available.length === 0) return null;

        return available.reduce((best, current) => {
            return current.metrics.taskCount < best.metrics.taskCount ? current : best;
        });
    }

    public getName(): string {
        return 'LEAST_BUSY';
    }
}

/**
 * Round Robin Strategy - Cycle through workers
 */
export class RoundRobinStrategy implements ILoadBalancingStrategy {
    #lastIndex = -1;

    public selectWorker(available: WorkerThread[]): WorkerThread | null {
        if (available.length === 0) return null;

        this.#lastIndex = (this.#lastIndex + 1) % available.length;
        return available[this.#lastIndex];
    }

    public getName(): string {
        return 'ROUND_ROBIN';
    }
}

/**
 * CPU Based Strategy - Select worker with lowest CPU usage
 */
export class CpuBasedStrategy implements ILoadBalancingStrategy {
    public selectWorker(available: WorkerThread[]): WorkerThread | null {
        if (available.length === 0) return null;

        return available.reduce((best, current) => {
            return current.metrics.cpuUsage < best.metrics.cpuUsage ? current : best;
        });
    }

    public getName(): string {
        return 'CPU_BASED';
    }
}

/**
 * RAM Based Strategy - Select worker with lowest memory usage
 */
export class RamBasedStrategy implements ILoadBalancingStrategy {
    public selectWorker(available: WorkerThread[]): WorkerThread | null {
        if (available.length === 0) return null;

        return available.reduce((best, current) => {
            return current.metrics.memoryUsage < best.metrics.memoryUsage ? current : best;
        });
    }

    public getName(): string {
        return 'RAM_BASED';
    }
}

/**
 * Random Strategy - Random selection
 */
export class RandomStrategy implements ILoadBalancingStrategy {
    public selectWorker(available: WorkerThread[]): WorkerThread | null {
        if (available.length === 0) return null;

        const index = Math.floor(Math.random() * available.length);
        return available[index];
    }

    public getName(): string {
        return 'RANDOM';
    }
}
