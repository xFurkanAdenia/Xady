/**
 * TaskTimeoutManager - Manages task timeouts
 */

import { TaskTimeoutException } from '../exceptions';

/**
 * Timeout handle
 */
interface TimeoutHandle {
    taskId: string;
    taskName: string;
    startTime: number;
    timeout: number;
    timerId: NodeJS.Timeout;
    callback: () => void;
}

/**
 * TaskTimeoutManager tracks and enforces task timeouts
 */
export class TaskTimeoutManager {
    readonly #timeouts = new Map<string, TimeoutHandle>();

    /**
     * Start tracking a task timeout
     * 
     * @param taskId - Task ID
     * @param taskName - Task name
     * @param timeout - Timeout in milliseconds
     * @param callback - Callback to invoke on timeout
     */
    public startTimeout(
        taskId: string,
        taskName: string,
        timeout: number,
        callback: (exception: TaskTimeoutException) => void
    ): void {
        if (this.#timeouts.has(taskId)) {
            this.clearTimeout(taskId);
        }

        const startTime = Date.now();
        const timerId = setTimeout(() => {
            const executionTime = Date.now() - startTime;
            const exception = new TaskTimeoutException(taskId, taskName, timeout, executionTime);
            this.#timeouts.delete(taskId);
            callback(exception);
        }, timeout);

        this.#timeouts.set(taskId, {
            taskId,
            taskName,
            startTime,
            timeout,
            timerId,
            callback: () => callback(new TaskTimeoutException(taskId, taskName, timeout, Date.now() - startTime))
        });
    }

    /**
     * Clear a task timeout
     * 
     * @param taskId - Task ID
     * @returns true if timeout was cleared, false if not found
     */
    public clearTimeout(taskId: string): boolean {
        const handle = this.#timeouts.get(taskId);
        if (!handle) {
            return false;
        }

        clearTimeout(handle.timerId);
        this.#timeouts.delete(taskId);
        return true;
    }

    /**
     * Check if a task has an active timeout
     * 
     * @param taskId - Task ID
     */
    public hasTimeout(taskId: string): boolean {
        return this.#timeouts.has(taskId);
    }

    /**
     * Get remaining time for a task
     * 
     * @param taskId - Task ID
     * @returns Remaining milliseconds, or null if no timeout
     */
    public getRemainingTime(taskId: string): number | null {
        const handle = this.#timeouts.get(taskId);
        if (!handle) {
            return null;
        }

        const elapsed = Date.now() - handle.startTime;
        const remaining = handle.timeout - elapsed;
        return Math.max(0, remaining);
    }

    /**
     * Get elapsed time for a task
     * 
     * @param taskId - Task ID
     * @returns Elapsed milliseconds, or null if no timeout
     */
    public getElapsedTime(taskId: string): number | null {
        const handle = this.#timeouts.get(taskId);
        if (!handle) {
            return null;
        }

        return Date.now() - handle.startTime;
    }

    /**
     * Get timeout info for a task
     * 
     * @param taskId - Task ID
     */
    public getTimeoutInfo(taskId: string): {
        taskId: string;
        taskName: string;
        timeout: number;
        startTime: number;
        elapsedTime: number;
        remainingTime: number;
    } | null {
        const handle = this.#timeouts.get(taskId);
        if (!handle) {
            return null;
        }

        const elapsedTime = Date.now() - handle.startTime;
        const remainingTime = Math.max(0, handle.timeout - elapsedTime);

        return {
            taskId: handle.taskId,
            taskName: handle.taskName,
            timeout: handle.timeout,
            startTime: handle.startTime,
            elapsedTime,
            remainingTime
        };
    }

    /**
     * Clear all timeouts
     */
    public clearAll(): void {
        for (const handle of this.#timeouts.values()) {
            clearTimeout(handle.timerId);
        }
        this.#timeouts.clear();
    }

    /**
     * Get count of active timeouts
     */
    public get size(): number {
        return this.#timeouts.size;
    }

    /**
     * Get all tracked task IDs
     */
    public getTrackedTaskIds(): string[] {
        return Array.from(this.#timeouts.keys());
    }
}
