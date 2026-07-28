/**
 * TaskRetryPolicy - Retry logic for failed tasks
 */

import { RetryPolicy } from '../types';

/**
 * TaskRetryPolicy manages retry attempts for failed tasks
 */
export class TaskRetryPolicy {
    readonly #policy: RetryPolicy;

    constructor(policy: RetryPolicy) {
        this.#policy = policy;
    }

    /**
     * Check if task should be retried
     * 
     * @param error - The error that caused the failure
     * @param attempt - Current attempt number (0-indexed)
     * @returns true if task should be retried
     */
    public shouldRetry(error: Error, attempt: number): boolean {
        if (attempt >= this.#policy.maxRetries) {
            return false;
        }

        if (this.#policy.retryIf) {
            return this.#policy.retryIf(error, attempt);
        }

        return true;
    }

    /**
     * Calculate delay before next retry
     * 
     * @param attempt - Current attempt number (0-indexed)
     * @returns Delay in milliseconds
     */
    public getRetryDelay(attempt: number): number {
        let delay: number;

        switch (this.#policy.strategy) {
            case 'fixed':
                delay = this.#policy.initialDelay;
                break;

            case 'linear':
                delay = this.#policy.initialDelay * (attempt + 1);
                break;

            case 'exponential':
                const multiplier = this.#policy.multiplier ?? 2;
                delay = this.#policy.initialDelay * Math.pow(multiplier, attempt);
                break;

            default:
                delay = this.#policy.initialDelay;
        }

        if (this.#policy.maxDelay !== undefined) {
            delay = Math.min(delay, this.#policy.maxDelay);
        }

        if (this.#policy.jitter !== undefined && this.#policy.jitter > 0) {
            const jitterAmount = delay * this.#policy.jitter;
            const randomJitter = (Math.random() * 2 - 1) * jitterAmount;
            delay += randomJitter;
        }

        return Math.max(0, Math.floor(delay));
    }

    /**
     * Get maximum retry attempts
     */
    public getMaxRetries(): number {
        return this.#policy.maxRetries;
    }

    /**
     * Get retry strategy
     */
    public getStrategy(): string {
        return this.#policy.strategy;
    }

    /**
     * Get policy configuration
     */
    public getPolicy(): Readonly<RetryPolicy> {
        return this.#policy;
    }

    /**
     * Create a default retry policy
     */
    public static createDefault(): TaskRetryPolicy {
        return new TaskRetryPolicy({
            maxRetries: 3,
            strategy: 'exponential',
            initialDelay: 1000,
            maxDelay: 30000,
            multiplier: 2,
            jitter: 0.1
        });
    }

    /**
     * Create a no-retry policy
     */
    public static createNoRetry(): TaskRetryPolicy {
        return new TaskRetryPolicy({
            maxRetries: 0,
            strategy: 'fixed',
            initialDelay: 0
        });
    }

    /**
     * Create a fixed delay retry policy
     */
    public static createFixed(maxRetries: number, delay: number): TaskRetryPolicy {
        return new TaskRetryPolicy({
            maxRetries,
            strategy: 'fixed',
            initialDelay: delay
        });
    }

    /**
     * Create an exponential backoff retry policy
     */
    public static createExponential(
        maxRetries: number,
        initialDelay: number,
        maxDelay?: number,
        multiplier: number = 2
    ): TaskRetryPolicy {
        return new TaskRetryPolicy({
            maxRetries,
            strategy: 'exponential',
            initialDelay,
            maxDelay,
            multiplier,
            jitter: 0.1
        });
    }

    /**
     * Create a linear backoff retry policy
     */
    public static createLinear(maxRetries: number, initialDelay: number, maxDelay?: number): TaskRetryPolicy {
        return new TaskRetryPolicy({
            maxRetries,
            strategy: 'linear',
            initialDelay,
            maxDelay
        });
    }
}
