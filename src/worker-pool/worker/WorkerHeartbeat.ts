/**
 * WorkerHeartbeat - PING/PONG heartbeat system
 */

import { WorkerThread } from './WorkerThread';
import { EventEmitter } from 'events';

interface PingRecord {
    sequence: number;
    sentAt: number;
    timeoutId: NodeJS.Timeout;
}

/**
 * WorkerHeartbeat manages heartbeat for workers
 */
export class WorkerHeartbeat extends EventEmitter {
    readonly #worker: WorkerThread;
    readonly #interval: number;
    readonly #timeout: number;

    #pingSequence = 0;
    #intervalId: NodeJS.Timeout | null = null;
    #pendingPing: PingRecord | null = null;
    #lastPongAt: number = 0;
    #isRunning = false;

    constructor(worker: WorkerThread, interval: number = 5000, timeout: number = 3000) {
        super();
        this.#worker = worker;
        this.#interval = interval;
        this.#timeout = timeout;
        this.#lastPongAt = Date.now();
    }

    /**
     * Start heartbeat
     */
    public start(): void {
        if (this.#isRunning) {
            return;
        }

        this.#isRunning = true;
        this.#intervalId = setInterval(() => this.sendPing(), this.#interval);
    }

    /**
     * Stop heartbeat
     */
    public stop(): void {
        if (!this.#isRunning) {
            return;
        }

        this.#isRunning = false;

        if (this.#intervalId) {
            clearInterval(this.#intervalId);
            this.#intervalId = null;
        }

        if (this.#pendingPing) {
            clearTimeout(this.#pendingPing.timeoutId);
            this.#pendingPing = null;
        }
    }

    /**
     * Send PING to worker
     */
    private sendPing(): void {
        if (this.#pendingPing) {
            return;
        }

        const sequence = this.#pingSequence++;
        const pingMessage = this.#worker.protocol.createPing(sequence);

        const timeoutId = setTimeout(() => {
            this.#pendingPing = null;
            this.emit('timeout', {
                workerId: this.#worker.id,
                sequence,
                sentAt: Date.now()
            });
        }, this.#timeout);

        this.#pendingPing = {
            sequence,
            sentAt: Date.now(),
            timeoutId
        };

        this.#worker.postMessage(pingMessage);
    }

    /**
     * Handle PONG from worker
     */
    public handlePong(sequence: number): void {
        if (!this.#pendingPing || this.#pendingPing.sequence !== sequence) {
            return;
        }

        const latency = Date.now() - this.#pendingPing.sentAt;
        clearTimeout(this.#pendingPing.timeoutId);
        this.#pendingPing = null;
        this.#lastPongAt = Date.now();

        this.emit('pong', {
            workerId: this.#worker.id,
            sequence,
            latency
        });
    }

    /**
     * Get last PONG timestamp
     */
    public get lastPongAt(): number {
        return this.#lastPongAt;
    }

    /**
     * Get time since last PONG
     */
    public get timeSinceLastPong(): number {
        return Date.now() - this.#lastPongAt;
    }

    /**
     * Check if heartbeat is healthy
     */
    public isHealthy(threshold: number = 15000): boolean {
        return this.timeSinceLastPong < threshold;
    }

    /**
     * Get heartbeat info
     */
    public getInfo(): {
        workerId: string;
        isRunning: boolean;
        lastPongAt: number;
        timeSinceLastPong: number;
        pendingPing: boolean;
    } {
        return {
            workerId: this.#worker.id,
            isRunning: this.#isRunning,
            lastPongAt: this.#lastPongAt,
            timeSinceLastPong: this.timeSinceLastPong,
            pendingPing: this.#pendingPing !== null
        };
    }
}
