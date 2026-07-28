/**
 * TaskCancellationToken - Cancellation support for tasks
 */

import { TaskCancelledException } from '../exceptions';

/**
 * TaskCancellationToken wraps AbortSignal and provides additional functionality
 */
export class TaskCancellationToken {
    readonly #taskId: string;
    readonly #taskName: string;
    readonly #controller: AbortController;
    readonly #callbacks = new Set<() => void>();

    #reason: string | null = null;
    #cancelledBy: string | null = null;
    #cancelledAt: number | null = null;

    constructor(taskId: string, taskName: string, externalSignal?: AbortSignal) {
        this.#taskId = taskId;
        this.#taskName = taskName;
        this.#controller = new AbortController();

        if (externalSignal) {
            if (externalSignal.aborted) {
                this.cancel('External signal was already aborted', 'external');
            } else {
                externalSignal.addEventListener('abort', () => {
                    this.cancel('Cancelled by external signal', 'external');
                });
            }
        }
    }

    /**
     * Get the AbortSignal
     */
    public get signal(): AbortSignal {
        return this.#controller.signal;
    }

    /**
     * Check if cancelled
     */
    public get isCancelled(): boolean {
        return this.#controller.signal.aborted;
    }

    /**
     * Get cancellation reason
     */
    public get reason(): string | null {
        return this.#reason;
    }

    /**
     * Get who cancelled the task
     */
    public get cancelledBy(): string | null {
        return this.#cancelledBy;
    }

    /**
     * Get when the task was cancelled
     */
    public get cancelledAt(): number | null {
        return this.#cancelledAt;
    }

    /**
     * Cancel the task
     * 
     * @param reason - Cancellation reason
     * @param cancelledBy - Who cancelled the task
     */
    public cancel(reason: string = 'Task cancelled', cancelledBy: string = 'unknown'): void {
        if (this.isCancelled) {
            return;
        }

        this.#reason = reason;
        this.#cancelledBy = cancelledBy;
        this.#cancelledAt = Date.now();

        this.#controller.abort();

        for (const callback of this.#callbacks) {
            try {
                callback();
            } catch (error) {
                // Ignore errors in cancellation callbacks
            }
        }

        this.#callbacks.clear();
    }

    /**
     * Register a callback to be invoked when cancelled
     * 
     * @param callback - Callback function
     * @returns Unregister function
     */
    public onCancel(callback: () => void): () => void {
        if (this.isCancelled) {
            callback();
            return () => {};
        }

        this.#callbacks.add(callback);
        return () => this.#callbacks.delete(callback);
    }

    /**
     * Throw if cancelled
     */
    public throwIfCancelled(): void {
        if (this.isCancelled) {
            throw new TaskCancelledException(
                this.#taskId,
                this.#taskName,
                this.#reason || 'Task was cancelled',
                this.#cancelledBy || undefined
            );
        }
    }

    /**
     * Create a linked token that cancels when this token or another token cancels
     * 
     * @param otherSignal - Another abort signal to link
     */
    public createLinkedToken(otherSignal: AbortSignal): TaskCancellationToken {
        const linked = new TaskCancellationToken(this.#taskId, this.#taskName);

        if (this.isCancelled) {
            linked.cancel(this.#reason || 'Parent token cancelled', this.#cancelledBy || 'parent');
        } else {
            this.onCancel(() => {
                linked.cancel(this.#reason || 'Parent token cancelled', this.#cancelledBy || 'parent');
            });
        }

        if (otherSignal.aborted) {
            linked.cancel('Linked signal was already aborted', 'linked');
        } else {
            otherSignal.addEventListener('abort', () => {
                linked.cancel('Cancelled by linked signal', 'linked');
            });
        }

        return linked;
    }

    /**
     * Create a token with a timeout
     * 
     * @param timeout - Timeout in milliseconds
     */
    public withTimeout(timeout: number): TaskCancellationToken {
        const token = new TaskCancellationToken(this.#taskId, this.#taskName, this.signal);

        setTimeout(() => {
            if (!token.isCancelled) {
                token.cancel(`Timeout after ${timeout}ms`, 'timeout');
            }
        }, timeout);

        return token;
    }

    /**
     * Get cancellation info
     */
    public getInfo(): {
        taskId: string;
        taskName: string;
        isCancelled: boolean;
        reason: string | null;
        cancelledBy: string | null;
        cancelledAt: number | null;
    } {
        return {
            taskId: this.#taskId,
            taskName: this.#taskName,
            isCancelled: this.isCancelled,
            reason: this.#reason,
            cancelledBy: this.#cancelledBy,
            cancelledAt: this.#cancelledAt
        };
    }
}
