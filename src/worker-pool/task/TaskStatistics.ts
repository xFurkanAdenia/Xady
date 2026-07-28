/**
 * TaskStatistics - Task execution statistics tracking
 */

import { TaskState } from '../types';

/**
 * Statistics for a single task type
 */
interface TaskTypeStats {
    totalExecutions: number;
    successCount: number;
    failureCount: number;
    cancelledCount: number;
    timeoutCount: number;
    totalExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    totalRetries: number;
}

/**
 * TaskStatistics tracks execution metrics for tasks
 */
export class TaskStatistics {
    readonly #stats = new Map<string, TaskTypeStats>();
    readonly #recentExecutionTimes: number[] = [];
    readonly #maxRecentSamples = 100;

    #totalTasks = 0;
    #completedTasks = 0;
    #failedTasks = 0;
    #cancelledTasks = 0;
    #timeoutTasks = 0;

    /**
     * Record task completion
     */
    public recordCompletion(taskName: string, executionTime: number, state: TaskState, retryCount: number = 0): void {
        this.#totalTasks++;

        const stats = this.#getOrCreateStats(taskName);
        stats.totalExecutions++;
        stats.totalExecutionTime += executionTime;
        stats.totalRetries += retryCount;

        if (executionTime < stats.minExecutionTime) {
            stats.minExecutionTime = executionTime;
        }
        if (executionTime > stats.maxExecutionTime) {
            stats.maxExecutionTime = executionTime;
        }

        switch (state) {
            case TaskState.COMPLETED:
                this.#completedTasks++;
                stats.successCount++;
                break;
            case TaskState.FAILED:
                this.#failedTasks++;
                stats.failureCount++;
                break;
            case TaskState.CANCELLED:
                this.#cancelledTasks++;
                stats.cancelledCount++;
                break;
            case TaskState.TIMEOUT:
                this.#timeoutTasks++;
                stats.timeoutCount++;
                break;
        }

        this.#recentExecutionTimes.push(executionTime);
        if (this.#recentExecutionTimes.length > this.#maxRecentSamples) {
            this.#recentExecutionTimes.shift();
        }
    }

    /**
     * Get statistics for a specific task type
     */
    public getTaskStats(taskName: string): TaskTypeStats | undefined {
        return this.#stats.get(taskName);
    }

    /**
     * Get global statistics
     */
    public getGlobalStats(): {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        cancelledTasks: number;
        timeoutTasks: number;
        successRate: number;
        failureRate: number;
        avgExecutionTime: number;
        recentAvgExecutionTime: number;
    } {
        const successRate = this.#totalTasks > 0 ? this.#completedTasks / this.#totalTasks : 0;
        const failureRate = this.#totalTasks > 0 ? this.#failedTasks / this.#totalTasks : 0;

        let totalExecutionTime = 0;
        for (const stats of this.#stats.values()) {
            totalExecutionTime += stats.totalExecutionTime;
        }
        const avgExecutionTime = this.#totalTasks > 0 ? totalExecutionTime / this.#totalTasks : 0;

        const recentSum = this.#recentExecutionTimes.reduce((sum, time) => sum + time, 0);
        const recentAvgExecutionTime = this.#recentExecutionTimes.length > 0 
            ? recentSum / this.#recentExecutionTimes.length 
            : 0;

        return {
            totalTasks: this.#totalTasks,
            completedTasks: this.#completedTasks,
            failedTasks: this.#failedTasks,
            cancelledTasks: this.#cancelledTasks,
            timeoutTasks: this.#timeoutTasks,
            successRate,
            failureRate,
            avgExecutionTime,
            recentAvgExecutionTime
        };
    }

    /**
     * Get all task type statistics
     */
    public getAllTaskStats(): Map<string, TaskTypeStats> {
        return new Map(this.#stats);
    }

    /**
     * Get average execution time for a task type
     */
    public getAverageExecutionTime(taskName: string): number {
        const stats = this.#stats.get(taskName);
        if (!stats || stats.totalExecutions === 0) {
            return 0;
        }
        return stats.totalExecutionTime / stats.totalExecutions;
    }

    /**
     * Get success rate for a task type
     */
    public getSuccessRate(taskName: string): number {
        const stats = this.#stats.get(taskName);
        if (!stats || stats.totalExecutions === 0) {
            return 0;
        }
        return stats.successCount / stats.totalExecutions;
    }

    /**
     * Reset statistics
     */
    public reset(): void {
        this.#stats.clear();
        this.#recentExecutionTimes.length = 0;
        this.#totalTasks = 0;
        this.#completedTasks = 0;
        this.#failedTasks = 0;
        this.#cancelledTasks = 0;
        this.#timeoutTasks = 0;
    }

    /**
     * Reset statistics for a specific task type
     */
    public resetTaskStats(taskName: string): void {
        this.#stats.delete(taskName);
    }

    /**
     * Get or create statistics for a task type
     */
    #getOrCreateStats(taskName: string): TaskTypeStats {
        let stats = this.#stats.get(taskName);
        if (!stats) {
            stats = {
                totalExecutions: 0,
                successCount: 0,
                failureCount: 0,
                cancelledCount: 0,
                timeoutCount: 0,
                totalExecutionTime: 0,
                minExecutionTime: Number.MAX_SAFE_INTEGER,
                maxExecutionTime: 0,
                totalRetries: 0
            };
            this.#stats.set(taskName, stats);
        }
        return stats;
    }

    /**
     * Export statistics to JSON
     */
    public toJSON(): object {
        const taskStats: Record<string, any> = {};
        for (const [name, stats] of this.#stats.entries()) {
            taskStats[name] = {
                ...stats,
                avgExecutionTime: stats.totalExecutions > 0 ? stats.totalExecutionTime / stats.totalExecutions : 0,
                successRate: stats.totalExecutions > 0 ? stats.successCount / stats.totalExecutions : 0
            };
        }

        return {
            global: this.getGlobalStats(),
            byTaskType: taskStats
        };
    }
}
