/**
 * LoadBalancer - Selects workers for task execution
 */

import { WorkerRegistry } from '../worker/WorkerRegistry';
import { WorkerThread } from '../worker/WorkerThread';
import { LoadBalancingStrategy as LoadBalancingStrategyEnum } from '../types';
import {
    ILoadBalancingStrategy,
    LeastBusyStrategy,
    RoundRobinStrategy,
    CpuBasedStrategy,
    RamBasedStrategy,
    RandomStrategy
} from './LoadBalancingStrategy';

/**
 * LoadBalancer manages worker selection
 */
export class LoadBalancer {
    readonly #registry: WorkerRegistry;
    #strategy: ILoadBalancingStrategy;

    constructor(registry: WorkerRegistry, strategy: LoadBalancingStrategyEnum = LoadBalancingStrategyEnum.LEAST_BUSY) {
        this.#registry = registry;
        this.#strategy = this.createStrategy(strategy);
    }

    /**
     * Select a worker for task execution
     */
    public selectWorker(): WorkerThread | null {
        const available = this.#registry.getAvailable();
        return this.#strategy.selectWorker(available);
    }

    /**
     * Change strategy
     */
    public setStrategy(strategy: LoadBalancingStrategyEnum): void {
        this.#strategy = this.createStrategy(strategy);
    }

    /**
     * Get current strategy name
     */
    public getStrategyName(): string {
        return this.#strategy.getName();
    }

    /**
     * Create strategy instance
     */
    private createStrategy(strategy: LoadBalancingStrategyEnum): ILoadBalancingStrategy {
        switch (strategy) {
            case LoadBalancingStrategyEnum.LEAST_BUSY:
                return new LeastBusyStrategy();
            case LoadBalancingStrategyEnum.ROUND_ROBIN:
                return new RoundRobinStrategy();
            case LoadBalancingStrategyEnum.CPU_BASED:
                return new CpuBasedStrategy();
            case LoadBalancingStrategyEnum.RAM_BASED:
                return new RamBasedStrategy();
            case LoadBalancingStrategyEnum.RANDOM:
                return new RandomStrategy();
            default:
                return new LeastBusyStrategy();
        }
    }
}
