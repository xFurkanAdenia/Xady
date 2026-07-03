import { Worker } from "worker_threads";
import * as os from "os";
import chalk from "chalk";

export enum TaskPriority {
    HIGH = 2,
    NORMAL = 1,
    LOW = 0
}

export interface TaskInfo {
    id: string;
    priority: TaskPriority;
    fnString: string;
    args: any[];
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    signal?: AbortSignal;
    onProgress?: (progress: any) => void;
}

export class WorkerPool {
    private static instance: WorkerPool;
    private workers: Worker[] = [];
    private activeWorkers = new Map<Worker, string | null>(); // Maps worker to current taskId
    private taskQueue: TaskInfo[] = [];
    private activeTasks = new Map<string, TaskInfo>();
    private maxWorkers = 2;
    private cpuAffinity: string = "all";
    private nextTaskId = 0;
    private isEnabled = false;

    private constructor() {}

    public static getInstance(): WorkerPool {
        if (!WorkerPool.instance) {
            WorkerPool.instance = new WorkerPool();
        }
        return WorkerPool.instance;
    }

    public init(enabled: boolean, maxWorkers: number, cpuAffinity: string) {
        this.shutdown();
        this.isEnabled = enabled;

        if (!this.isEnabled) {
            console.log(chalk.yellow("[WorkerPool] Ayarlardan kapalı olduğu için başlatılmadı. Tüm işlemler ana thread (Event Loop) üzerinde çalışacak."));
            return;
        }

        this.maxWorkers = maxWorkers > 0 ? maxWorkers : Math.max(1, os.cpus().length - 1);
        this.cpuAffinity = cpuAffinity;

        const workerPath = require.resolve("../workers/worker.js");

        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new Worker(workerPath);
            worker.on("message", (msg) => this.handleWorkerMessage(worker, msg));
            worker.on("error", (err) => this.handleWorkerError(worker, err as Error));
            worker.on("exit", (code) => this.handleWorkerExit(worker, code));
            this.workers.push(worker);
            this.activeWorkers.set(worker, null);
        }
        
        console.log(chalk.green(`[WorkerPool] Aktifleştirildi. ${this.maxWorkers} iş parçacığı arka planda çalışıyor.`));
    }

    public execute<T>(
        fn: (...args: any[]) => T | Promise<T>,
        args: any[],
        priority: TaskPriority = TaskPriority.NORMAL,
        signal?: AbortSignal,
        onProgress?: (progress: any) => void
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if (signal?.aborted) {
                return reject(new Error("Görev başlamadan iptal edildi."));
            }

            // Eğer WorkerPool kapalıysa her şeyi doğrudan ana thread üzerinde güvenlice çalıştır.
            if (!this.isEnabled) {
                try {
                    const res = fn(...args);
                    if (res instanceof Promise) {
                        res.then(resolve).catch(reject);
                    } else {
                        resolve(res);
                    }
                } catch (err) {
                    reject(err);
                }
                return;
            }

            const id = `task_${this.nextTaskId++}`;
            const fnString = fn.toString();

            const task: TaskInfo = {
                id,
                priority,
                fnString,
                args,
                resolve,
                reject,
                signal,
                onProgress
            };

            if (signal) {
                signal.addEventListener("abort", () => {
                    this.cancelTask(id, "AbortSignal tarafından görev iptal edildi.");
                });
            }

            this.taskQueue.push(task);
            this.taskQueue.sort((a, b) => b.priority - a.priority);

            this.processQueue();
        });
    }

    private getFreeWorker(): Worker | null {
        for (const worker of this.workers) {
            if (this.activeWorkers.get(worker) === null) {
                return worker;
            }
        }
        return null;
    }

    private processQueue() {
        if (this.taskQueue.length === 0) return;

        const worker = this.getFreeWorker();
        if (!worker) return; // Boşta worker yok, sırasını bekleyecek.

        const task = this.taskQueue.shift()!;
        this.activeWorkers.set(worker, task.id);

        worker.postMessage({
            type: "start",
            id: task.id,
            fnString: task.fnString,
            args: task.args,
            cpuAffinity: this.cpuAffinity
        });

        this.activeTasks.set(task.id, task);
    }

    private handleWorkerMessage(worker: Worker, msg: any) {
        if (!msg || typeof msg !== "object") return;
        const { type, id, result, error, progress } = msg;

        const task = this.activeTasks.get(id);
        if (!task) return;

        if (type === "progress") {
            if (task.onProgress) {
                try {
                    task.onProgress(progress);
                } catch (e) {
                    console.error("Worker onProgress callback hatası:", e);
                }
            }
        } else if (type === "success") {
            task.resolve(result);
            this.cleanupTask(worker, id);
        } else if (type === "failure") {
            task.reject(new Error(error || "Worker işlemi başarısız oldu."));
            this.cleanupTask(worker, id);
        }
    }

    private handleWorkerError(worker: Worker, err: Error) {
        console.error(chalk.red("[WorkerPool] İş parçacığı çöktü:"), err);
        const activeTaskId = this.activeWorkers.get(worker);
        if (activeTaskId) {
            const task = this.activeTasks.get(activeTaskId);
            if (task) {
                task.reject(err);
                this.cleanupTask(worker, activeTaskId);
            }
        }
        this.replaceWorker(worker);
    }

    private handleWorkerExit(worker: Worker, code: number) {
        if (code !== 0) {
            console.warn(chalk.yellow(`[WorkerPool] Worker beklenmedik şekilde kapandı (Kod: ${code})`));
        }
        const activeTaskId = this.activeWorkers.get(worker);
        if (activeTaskId) {
            const task = this.activeTasks.get(activeTaskId);
            if (task) {
                task.reject(new Error(`Worker ${code} kodu ile kapandı.`));
                this.cleanupTask(worker, activeTaskId);
            }
        }
        if (this.isEnabled) {
            this.replaceWorker(worker);
        }
    }

    private replaceWorker(oldWorker: Worker) {
        const index = this.workers.indexOf(oldWorker);
        if (index !== -1) {
            this.workers.splice(index, 1);
            this.activeWorkers.delete(oldWorker);
        }
        const workerPath = require.resolve("../workers/worker.js");
        const newWorker = new Worker(workerPath);
        newWorker.on("message", (msg) => this.handleWorkerMessage(newWorker, msg));
        newWorker.on("error", (err) => this.handleWorkerError(newWorker, err as Error));
        newWorker.on("exit", (code) => this.handleWorkerExit(newWorker, code));
        this.workers.push(newWorker);
        this.activeWorkers.set(newWorker, null);
        this.processQueue();
    }

    private cleanupTask(worker: Worker, id: string) {
        this.activeWorkers.set(worker, null);
        this.activeTasks.delete(id);
        this.processQueue();
    }

    public cancelTask(id: string, reason: string = "Görev iptal edildi.") {
        const queueIndex = this.taskQueue.findIndex((t) => t.id === id);
        if (queueIndex !== -1) {
            const task = this.taskQueue.splice(queueIndex, 1)[0];
            task.reject(new Error(reason));
            return true;
        }

        const task = this.activeTasks.get(id);
        if (task) {
            for (const [worker, activeId] of this.activeWorkers.entries()) {
                if (activeId === id) {
                    task.reject(new Error(reason));
                    this.cleanupTask(worker, id);
                    worker.terminate(); // Kill worker directly
                    return true;
                }
            }
        }
        return false;
    }

    public shutdown() {
        for (const worker of this.workers) {
            worker.terminate();
        }
        this.workers = [];
        this.activeWorkers.clear();
        this.activeTasks.clear();
        this.taskQueue = [];
    }
}
