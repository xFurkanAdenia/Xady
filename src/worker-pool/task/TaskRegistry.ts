/**
 * TaskRegistry - Registry for pre-registered task handlers
 * 
 * Security: No eval() or new Function() - only pre-registered tasks can execute
 */

import { TaskDescriptor, TaskHandler } from '../types';
import { DuplicateTaskException, TaskNotFoundException } from '../exceptions';

/**
 * TaskRegistry manages registered task handlers
 */
export class TaskRegistry {
    readonly #tasks = new Map<string, TaskDescriptor>();
    readonly #metadata = new Map<string, { registeredAt: number; executionCount: number }>();

    /**
     * Register a task handler
     * 
     * @param descriptor - Task descriptor
     * @throws DuplicateTaskException if task name already exists
     */
    public register<TArgs = any, TResult = any>(
        descriptor: TaskDescriptor<TArgs, TResult>
    ): void {
        if (this.#tasks.has(descriptor.name)) {
            throw new DuplicateTaskException(descriptor.name);
        }

        this.#tasks.set(descriptor.name, descriptor as TaskDescriptor);
        this.#metadata.set(descriptor.name, {
            registeredAt: Date.now(),
            executionCount: 0
        });
    }

    /**
     * Register a task handler with inline configuration
     * 
     * @param name - Task name
     * @param handler - Task handler function
     * @param options - Optional configuration
     */
    public registerTask<TArgs = any, TResult = any>(
        name: string,
        handler: TaskHandler<TArgs, TResult>,
        options?: {
            timeout?: number;
            retryPolicy?: TaskDescriptor['retryPolicy'];
            priority?: TaskDescriptor['priority'];
            description?: string;
            metadata?: Record<string, any>;
        }
    ): void {
        const descriptor: TaskDescriptor<TArgs, TResult> = {
            name,
            handler,
            ...options
        };

        this.register(descriptor);
    }

    /**
     * Unregister a task
     * 
     * @param name - Task name
     * @returns true if task was removed, false if not found
     */
    public unregister(name: string): boolean {
        this.#metadata.delete(name);
        return this.#tasks.delete(name);
    }

    /**
     * Check if a task is registered
     * 
     * @param name - Task name
     */
    public has(name: string): boolean {
        return this.#tasks.has(name);
    }

    /**
     * Get a task descriptor
     * 
     * @param name - Task name
     * @throws TaskNotFoundException if task not found
     */
    public get(name: string): TaskDescriptor {
        const descriptor = this.#tasks.get(name);
        if (!descriptor) {
            throw new TaskNotFoundException(name);
        }
        return descriptor;
    }

    /**
     * Try to get a task descriptor
     * 
     * @param name - Task name
     * @returns Task descriptor or undefined if not found
     */
    public tryGet(name: string): TaskDescriptor | undefined {
        return this.#tasks.get(name);
    }

    /**
     * Get all registered task names
     */
    public getTaskNames(): string[] {
        return Array.from(this.#tasks.keys());
    }

    /**
     * Get all task descriptors
     */
    public getAll(): TaskDescriptor[] {
        return Array.from(this.#tasks.values());
    }

    /**
     * Get task count
     */
    public get size(): number {
        return this.#tasks.size;
    }

    /**
     * Clear all registered tasks
     */
    public clear(): void {
        this.#tasks.clear();
        this.#metadata.clear();
    }

    /**
     * Increment execution count for a task
     */
    public incrementExecutionCount(name: string): void {
        const metadata = this.#metadata.get(name);
        if (metadata) {
            metadata.executionCount++;
        }
    }

    /**
     * Get task metadata
     */
    public getMetadata(name: string): { registeredAt: number; executionCount: number } | undefined {
        return this.#metadata.get(name);
    }

    /**
     * Get execution count for a task
     */
    public getExecutionCount(name: string): number {
        return this.#metadata.get(name)?.executionCount ?? 0;
    }

    /**
     * Export task list for worker
     * Returns only task names (handlers are not serializable)
     */
    public exportForWorker(): string[] {
        return this.getTaskNames();
    }

    /**
     * Validate task exists (throws if not found)
     */
    public validate(name: string): void {
        if (!this.has(name)) {
            throw new TaskNotFoundException(name);
        }
    }
}
