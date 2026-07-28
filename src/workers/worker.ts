/**
 * Worker Thread - Task execution worker
 * 
 * This worker executes pre-registered tasks sent from the pool.
 * NO eval() or new Function() - only registered tasks are allowed.
 */

import { parentPort, workerData, threadId } from 'worker_threads';
import * as os from 'os';

if (!parentPort) {
    process.exit(1);
}

const workerId: string = workerData?.workerId || `worker_${threadId}`;
const taskRegistry = new Map<string, Function>();

let currentTaskId: string | null = null;
let taskStartTime = 0;

/**
 * Register built-in tasks
 */
function registerBuiltInTasks(): void {
    // Example built-in task
    taskRegistry.set('system:info', () => {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem()
        };
    });
}

/**
 * Get system metrics
 */
function getMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
        memoryUsage: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            arrayBuffers: memUsage.arrayBuffers || 0
        },
        heapUsage: {
            total: memUsage.heapTotal,
            used: memUsage.heapUsed,
            limit: memUsage.heapTotal,
            utilization: memUsage.heapTotal > 0 ? memUsage.heapUsed / memUsage.heapTotal : 0
        },
        eventLoopDelay: 0,
        taskCount: 0,
        uptime: process.uptime() * 1000
    };
}

/**
 * Handle messages from pool
 */
parentPort.on('message', async (msg: any) => {
    if (!msg || typeof msg !== 'object') return;

    const { type } = msg;

    try {
        switch (type) {
            case 'START':
                await handleStart(msg);
                break;

            case 'CANCEL':
                handleCancel(msg);
                break;

            case 'PING':
                handlePing(msg);
                break;

            case 'SHUTDOWN':
                handleShutdown(msg);
                break;

            case 'TERMINATE':
                process.exit(0);
                break;

            case 'REGISTER_TASK':
                handleRegisterTask(msg);
                break;

            default:
                sendError(new Error(`Unknown message type: ${type}`));
        }
    } catch (error) {
        sendError(error as Error, currentTaskId || undefined);
    }
});

/**
 * Handle START message
 */
async function handleStart(msg: any): Promise<void> {
    const { taskId, taskName, args, timeout } = msg;
    currentTaskId = taskId;
    taskStartTime = Date.now();

    const handler = taskRegistry.get(taskName);
    if (!handler) {
        sendFailure(taskId, new Error(`Task "${taskName}" is not registered in worker`));
        currentTaskId = null;
        return;
    }

    let timeoutId: NodeJS.Timeout | undefined;
    const abortController = new AbortController();

    if (timeout) {
        timeoutId = setTimeout(() => {
            abortController.abort();
            sendFailure(taskId, new Error(`Task timed out after ${timeout}ms`));
            currentTaskId = null;
        }, timeout);
    }

    try {
        const context = {
            taskId,
            taskName,
            workerId,
            threadId,
            createdAt: taskStartTime,
            startedAt: taskStartTime,
            get executionTime() {
                return Date.now() - taskStartTime;
            },
            signal: abortController.signal,
            progress: (data: any) => {
                sendProgress(taskId, data);
            },
            log: (level: string, message: string, data?: any) => {
                sendLog(level, message, taskId, data);
            },
            data: new Map<string, any>()
        };

        const result = await handler(args, context);

        if (timeoutId) clearTimeout(timeoutId);

        if (!abortController.signal.aborted) {
            sendSuccess(taskId, result);
        }
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        sendFailure(taskId, error as Error);
    } finally {
        currentTaskId = null;
    }
}

/**
 * Handle CANCEL message
 */
function handleCancel(msg: any): void {
    const { taskId } = msg;
    if (currentTaskId === taskId) {
        sendFailure(taskId, new Error('Task was cancelled'));
        currentTaskId = null;
    }
}

/**
 * Handle PING message
 */
function handlePing(msg: any): void {
    const { sequence } = msg;
    sendPong(sequence);
}

/**
 * Handle SHUTDOWN message
 */
function handleShutdown(msg: any): void {
    const { gracePeriod } = msg;

    if (currentTaskId === null) {
        process.exit(0);
    }

    setTimeout(() => {
        process.exit(0);
    }, gracePeriod);
}

/**
 * Handle REGISTER_TASK message (dynamic task registration)
 */
function handleRegisterTask(msg: any): void {
    // This would be used if we want to dynamically send task handlers
    // For now, tasks must be registered at worker startup
}

/**
 * Send SUCCESS message
 */
function sendSuccess(taskId: string, result: any): void {
    const executionTime = Date.now() - taskStartTime;
    parentPort!.postMessage({
        type: 'SUCCESS',
        timestamp: Date.now(),
        taskId,
        result,
        executionTime
    });
}

/**
 * Send FAILURE message
 */
function sendFailure(taskId: string, error: Error): void {
    const executionTime = Date.now() - taskStartTime;
    parentPort!.postMessage({
        type: 'FAILURE',
        timestamp: Date.now(),
        taskId,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        executionTime
    });
}

/**
 * Send PROGRESS message
 */
function sendProgress(taskId: string, progress: any): void {
    parentPort!.postMessage({
        type: 'PROGRESS',
        timestamp: Date.now(),
        taskId,
        progress
    });
}

/**
 * Send PONG message
 */
function sendPong(sequence: number): void {
    parentPort!.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        sequence,
        metrics: getMetrics()
    });
}

/**
 * Send LOG message
 */
function sendLog(level: string, message: string, taskId?: string, data?: any): void {
    parentPort!.postMessage({
        type: 'LOG',
        timestamp: Date.now(),
        level,
        message,
        taskId,
        data
    });
}

/**
 * Send ERROR message
 */
function sendError(error: Error, taskId?: string): void {
    parentPort!.postMessage({
        type: 'ERROR',
        timestamp: Date.now(),
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        taskId
    });
}

/**
 * Send READY message
 */
function sendReady(): void {
    parentPort!.postMessage({
        type: 'READY',
        timestamp: Date.now(),
        workerId,
        threadId,
        capabilities: {
            version: '1.0.0',
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            cpuCount: os.cpus().length,
            totalMemory: os.totalmem()
        }
    });
}

// Initialize
registerBuiltInTasks();
sendReady();
