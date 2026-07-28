/**
 * TaskQueue - Task queue wrapper around PriorityQueue
 */

import { PriorityQueue } from '../queue/PriorityQueue';
import { TaskPriority } from '../types';

/**
 * Internal task wrapper for queue
 */
export interface QueuedTask {
    readonly id: string;
    readonly name: string;
    readonly priority: TaskPriority;
    readonly args: any[];
    readonly queuedAt: number;
    readonly timeout?: number;
    readonly signal?: AbortSignal;
    readonly onProgress?: (progress: any) => void;
    readonly resolve: (value: any) => void;
    readonly reject: (reason: any) => void;
    readonly metadata?: Record<string, any>;
}

/**
 * TaskQueue manages the task priority queue
 */
export class TaskQueue {
    readonly #queue: PriorityQueue<QueuedTask>;
    readonly #maxSize: number;

    constructor(maxSize: number = 0) {
        this.#maxSize = maxSize;
        this.#queue = new PriorityQueue<QueuedTask>((a, b) => {
            // Primary: Priority (higher first)
            const priorityDiff = a.priority - b.priority;
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            // Secondary: FIFO (earlier first)
            return b.queuedAt - a.queuedAt;
        });
    }

    /**
     * Add a task to the queue
     * 
     * @param task - Task to enqueue
     * @throws Error if queue is full
     */
    public enqueue(task: QueuedTask): void {
        if (this.#maxSize > 0 && this.#queue.size >= this.#maxSize) {
            throw new Error(`Task queue is full (max size: ${this.#maxSize})`);
        }

        this.#queue.enqueue(task);
    }

    /**
     * Remove and return the highest priority task
     */
    public dequeue(): QueuedTask | undefined {
        return this.#queue.dequeue();
    }

    /**
     * View the highest priority task without removing it
     */
    public peek(): QueuedTask | undefined {
        return this.#queue.peek();
    }

    /**
     * Remove a specific task by ID
     * 
     * @param taskId - Task ID to remove
     * @returns Removed task, or undefined if not found
     */
    public removeById(taskId: string): QueuedTask | undefined {
        const index = this.#queue.findIndex(t => t.id === taskId);
        if (index === -1) {
            return undefined;
        }

        const task = this.#queue.toArray()[index];
        this.#queue.removeAt(index);
        return task;
    }

    /**
     * Find a task by ID
     */
    public findById(taskId: string): QueuedTask | undefined {
        return this.#queue.toArray().find(t => t.id === taskId);
    }

    /**
     * Check if queue contains a task
     */
    public hasTask(taskId: string): boolean {
        return this.#queue.findIndex(t => t.id === taskId) !== -1;
    }

    /**
     * Get queue size
     */
    public get size(): number {
        return this.#queue.size;
    }

    /**
     * Check if queue is empty
     */
    public isEmpty(): boolean {
        return this.#queue.isEmpty();
    }

    /**
     * Check if queue is full
     */
    public isFull(): boolean {
        return this.#maxSize > 0 && this.#queue.size >= this.#maxSize;
    }

    /**
     * Get max queue size
     */
    public get maxSize(): number {
        return this.#maxSize;
    }

    /**
     * Clear all tasks
     */
    public clear(): void {
        this.#queue.clear();
    }

    /**
     * Get all tasks (not sorted by priority)
     */
    public toArray(): QueuedTask[] {
        return this.#queue.toArray();
    }

    /**
     * Get all tasks sorted by priority
     */
    public toSortedArray(): QueuedTask[] {
        return this.#queue.toSortedArray();
    }

    /**
     * Get queue statistics
     */
    public getStatistics(): {
        total: number;
        byPriority: Record<string, number>;
        oldestTask: number | null;
        averageWaitTime: number;
    } {
        const tasks = this.#queue.toArray();
        const now = Date.now();

        const byPriority: Record<string, number> = {
            CRITICAL: 0,
            HIGH: 0,
            NORMAL: 0,
            LOW: 0,
            IDLE: 0
        };

        let oldestTime: number | null = null;
        let totalWaitTime = 0;

        for (const task of tasks) {
            const priorityName = TaskPriority[task.priority];
            byPriority[priorityName] = (byPriority[priorityName] || 0) + 1;

            const waitTime = now - task.queuedAt;
            totalWaitTime += waitTime;

            if (oldestTime === null || task.queuedAt < oldestTime) {
                oldestTime = task.queuedAt;
            }
        }

        return {
            total: tasks.length,
            byPriority,
            oldestTask: oldestTime,
            averageWaitTime: tasks.length > 0 ? totalWaitTime / tasks.length : 0
        };
    }

    /**
     * Validate heap invariant (for debugging)
     */
    public validateHeap(): boolean {
        return this.#queue.validateHeap();
    }
}
