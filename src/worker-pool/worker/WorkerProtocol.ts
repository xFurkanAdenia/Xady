/**
 * WorkerProtocol - Protocol handler for worker communication
 */

import {
    WorkerMessage,
    WorkerMessageType,
    StartMessage,
    CancelMessage,
    PingMessage,
    ShutdownMessage,
    TerminateMessage,
    ReadyMessage,
    SuccessMessage,
    FailureMessage,
    ProgressMessage,
    PongMessage,
    LogMessage,
    MetricsMessage,
    StateChangeMessage,
    ErrorMessage,
    isValidMessage,
    createStartMessage,
    createCancelMessage,
    createPingMessage,
    createShutdownMessage,
    createTerminateMessage,
    serializeError
} from '../types';
import { WorkerProtocolException } from '../exceptions';
import { WorkerSerializer } from './WorkerSerializer';

/**
 * WorkerProtocol handles message serialization and validation
 */
export class WorkerProtocol {
    readonly #workerId: string;
    readonly #version: string = '1.0.0';

    constructor(workerId: string) {
        this.#workerId = workerId;
    }

    /**
     * Create a START message
     */
    public createStart(
        taskId: string,
        taskName: string,
        args: any[],
        timeout?: number,
        cpuAffinity?: string
    ): StartMessage {
        WorkerSerializer.validate(args, 'args');
        return createStartMessage(taskId, taskName, args, timeout, cpuAffinity);
    }

    /**
     * Create a CANCEL message
     */
    public createCancel(taskId: string, reason: string): CancelMessage {
        return createCancelMessage(taskId, reason);
    }

    /**
     * Create a PING message
     */
    public createPing(sequence: number): PingMessage {
        return createPingMessage(sequence);
    }

    /**
     * Create a SHUTDOWN message
     */
    public createShutdown(gracePeriod: number): ShutdownMessage {
        return createShutdownMessage(gracePeriod);
    }

    /**
     * Create a TERMINATE message
     */
    public createTerminate(): TerminateMessage {
        return createTerminateMessage();
    }

    /**
     * Validate an incoming message
     * 
     * @throws WorkerProtocolException if message is invalid
     */
    public validate(msg: any): WorkerMessage {
        if (!isValidMessage(msg)) {
            throw new WorkerProtocolException(
                this.#workerId,
                'Invalid message structure',
                typeof msg === 'object' && msg !== null ? msg.type : undefined
            );
        }

        return msg;
    }

    /**
     * Validate and type-check a specific message type
     */
    public validateType<T extends WorkerMessage>(
        msg: any,
        expectedType: WorkerMessageType
    ): T {
        const validated = this.validate(msg);

        if (validated.type !== expectedType) {
            throw new WorkerProtocolException(
                this.#workerId,
                `Expected message type ${expectedType}, got ${validated.type}`,
                validated.type
            );
        }

        return validated as T;
    }

    /**
     * Serialize a message for sending
     */
    public serialize(msg: WorkerMessage): string {
        try {
            return JSON.stringify(msg);
        } catch (error) {
            throw new WorkerProtocolException(
                this.#workerId,
                'Failed to serialize message',
                msg.type,
                error as Error
            );
        }
    }

    /**
     * Deserialize a message
     */
    public deserialize(data: string): WorkerMessage {
        try {
            const msg = JSON.parse(data);
            return this.validate(msg);
        } catch (error) {
            throw new WorkerProtocolException(
                this.#workerId,
                'Failed to deserialize message',
                undefined,
                error as Error
            );
        }
    }

    /**
     * Create a READY message (worker -> pool)
     */
    public static createReady(
        workerId: string,
        threadId: number,
        capabilities: ReadyMessage['capabilities']
    ): ReadyMessage {
        return {
            type: WorkerMessageType.READY,
            timestamp: Date.now(),
            workerId,
            threadId,
            capabilities
        };
    }

    /**
     * Create a SUCCESS message (worker -> pool)
     */
    public static createSuccess(
        taskId: string,
        result: any,
        executionTime: number
    ): SuccessMessage {
        return {
            type: WorkerMessageType.SUCCESS,
            timestamp: Date.now(),
            taskId,
            result,
            executionTime
        };
    }

    /**
     * Create a FAILURE message (worker -> pool)
     */
    public static createFailure(
        taskId: string,
        error: Error,
        executionTime: number
    ): FailureMessage {
        return {
            type: WorkerMessageType.FAILURE,
            timestamp: Date.now(),
            taskId,
            error: serializeError(error),
            executionTime
        };
    }

    /**
     * Create a PROGRESS message (worker -> pool)
     */
    public static createProgress(taskId: string, progress: any): ProgressMessage {
        return {
            type: WorkerMessageType.PROGRESS,
            timestamp: Date.now(),
            taskId,
            progress
        };
    }

    /**
     * Create a PONG message (worker -> pool)
     */
    public static createPong(
        sequence: number,
        metrics: PongMessage['metrics']
    ): PongMessage {
        return {
            type: WorkerMessageType.PONG,
            timestamp: Date.now(),
            sequence,
            metrics
        };
    }

    /**
     * Create a LOG message (worker -> pool)
     */
    public static createLog(
        level: LogMessage['level'],
        message: string,
        taskId?: string,
        data?: any
    ): LogMessage {
        return {
            type: WorkerMessageType.LOG,
            timestamp: Date.now(),
            level,
            message,
            taskId,
            data
        };
    }

    /**
     * Create a METRICS message (worker -> pool)
     */
    public static createMetrics(metrics: MetricsMessage['metrics']): MetricsMessage {
        return {
            type: WorkerMessageType.METRICS,
            timestamp: Date.now(),
            metrics
        };
    }

    /**
     * Create a STATE_CHANGE message (worker -> pool)
     */
    public static createStateChange(
        oldState: string,
        newState: string,
        reason?: string
    ): StateChangeMessage {
        return {
            type: WorkerMessageType.STATE_CHANGE,
            timestamp: Date.now(),
            oldState,
            newState,
            reason
        };
    }

    /**
     * Create an ERROR message (worker -> pool)
     */
    public static createError(error: Error, taskId?: string): ErrorMessage {
        return {
            type: WorkerMessageType.ERROR,
            timestamp: Date.now(),
            error: serializeError(error),
            taskId
        };
    }

    /**
     * Get protocol version
     */
    public get version(): string {
        return this.#version;
    }

    /**
     * Get worker ID
     */
    public get workerId(): string {
        return this.#workerId;
    }
}
