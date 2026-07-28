/**
 * TaskResult - Wrapper for task execution results
 */

import { TaskResult as ITaskResult } from '../types';

/**
 * TaskResult implementation
 */
export class TaskResultImpl<T = any> implements ITaskResult<T> {
    readonly #success: boolean;
    readonly #value?: T;
    readonly #error?: Error;
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #workerId: string;
    readonly #executionTime: number;
    readonly #retryCount: number;
    readonly #completedAt: number;

    private constructor(config: {
        success: boolean;
        value?: T;
        error?: Error;
        taskId: string;
        taskName: string;
        workerId: string;
        executionTime: number;
        retryCount: number;
        completedAt: number;
    }) {
        this.#success = config.success;
        this.#value = config.value;
        this.#error = config.error;
        this.#taskId = config.taskId;
        this.#taskName = config.taskName;
        this.#workerId = config.workerId;
        this.#executionTime = config.executionTime;
        this.#retryCount = config.retryCount;
        this.#completedAt = config.completedAt;
    }

    public get success(): boolean {
        return this.#success;
    }

    public get value(): T | undefined {
        return this.#value;
    }

    public get error(): Error | undefined {
        return this.#error;
    }

    public get taskId(): string {
        return this.#taskId;
    }

    public get taskName(): string {
        return this.#taskName;
    }

    public get workerId(): string {
        return this.#workerId;
    }

    public get executionTime(): number {
        return this.#executionTime;
    }

    public get retryCount(): number {
        return this.#retryCount;
    }

    public get completedAt(): number {
        return this.#completedAt;
    }

    /**
     * Get the value or throw the error
     */
    public unwrap(): T {
        if (this.#success) {
            return this.#value!;
        }
        throw this.#error;
    }

    /**
     * Get the value or a default
     */
    public unwrapOr(defaultValue: T): T {
        return this.#success ? this.#value! : defaultValue;
    }

    /**
     * Check if result is success
     */
    public isSuccess(): this is { value: T } {
        return this.#success;
    }

    /**
     * Check if result is failure
     */
    public isFailure(): this is { error: Error } {
        return !this.#success;
    }

    /**
     * Map the result value if success
     */
    public map<U>(fn: (value: T) => U): TaskResultImpl<U> {
        if (this.#success) {
            try {
                const mapped = fn(this.#value!);
                return TaskResultImpl.success(mapped, {
                    taskId: this.#taskId,
                    taskName: this.#taskName,
                    workerId: this.#workerId,
                    executionTime: this.#executionTime,
                    retryCount: this.#retryCount,
                    completedAt: this.#completedAt
                });
            } catch (error) {
                return TaskResultImpl.failure(error as Error, {
                    taskId: this.#taskId,
                    taskName: this.#taskName,
                    workerId: this.#workerId,
                    executionTime: this.#executionTime,
                    retryCount: this.#retryCount,
                    completedAt: this.#completedAt
                });
            }
        }
        return TaskResultImpl.failure(this.#error!, {
            taskId: this.#taskId,
            taskName: this.#taskName,
            workerId: this.#workerId,
            executionTime: this.#executionTime,
            retryCount: this.#retryCount,
            completedAt: this.#completedAt
        });
    }

    /**
     * Create a successful result
     */
    public static success<T>(value: T, metadata: {
        taskId: string;
        taskName: string;
        workerId: string;
        executionTime: number;
        retryCount: number;
        completedAt: number;
    }): TaskResultImpl<T> {
        return new TaskResultImpl({
            success: true,
            value,
            ...metadata
        });
    }

    /**
     * Create a failed result
     */
    public static failure<T = any>(error: Error, metadata: {
        taskId: string;
        taskName: string;
        workerId: string;
        executionTime: number;
        retryCount: number;
        completedAt: number;
    }): TaskResultImpl<T> {
        return new TaskResultImpl({
            success: false,
            error,
            ...metadata
        });
    }

    /**
     * Convert to plain object
     */
    public toJSON(): object {
        return {
            success: this.#success,
            value: this.#value,
            error: this.#error ? {
                name: this.#error.name,
                message: this.#error.message,
                stack: this.#error.stack
            } : undefined,
            taskId: this.#taskId,
            taskName: this.#taskName,
            workerId: this.#workerId,
            executionTime: this.#executionTime,
            retryCount: this.#retryCount,
            completedAt: this.#completedAt
        };
    }
}
