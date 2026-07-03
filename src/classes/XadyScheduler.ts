import { WorkerPool, TaskPriority } from "./WorkerPool";

export interface ScheduledTask {
    id: number;
    moduleName: string;
    callback: () => void | Promise<void>;
    isAsync: boolean;
    intervalTicks: number;
    remainingTicks: number;
    isCancelled: boolean;
}

export class XadyScheduler {
    private static instance: XadyScheduler;
    private tasks = new Map<number, ScheduledTask>();
    private nextTaskId = 1;
    private tickInterval: NodeJS.Timeout | null = null;
    private readonly tickRateMs = 50; // 20 ticks per second (Minecraft style)

    private constructor() {
        this.startHeartbeat();
    }

    public static getInstance(): XadyScheduler {
        if (!XadyScheduler.instance) {
            XadyScheduler.instance = new XadyScheduler();
        }
        return XadyScheduler.instance;
    }

    private startHeartbeat() {
        if (this.tickInterval) return;
        this.tickInterval = setInterval(() => {
            this.tick();
        }, this.tickRateMs);
    }

    private tick() {
        for (const [id, task] of this.tasks.entries()) {
            if (task.isCancelled) {
                this.tasks.delete(id);
                continue;
            }

            task.remainingTicks--;

            if (task.remainingTicks <= 0) {
                // Execute task
                if (task.isAsync) {
                    WorkerPool.getInstance().execute(
                        task.callback,
                        [],
                        TaskPriority.NORMAL
                    ).catch((err) => {
                        console.error(`[XadyScheduler] Async görev hatası (Modül: ${task.moduleName}):`, err);
                    });
                } else {
                    try {
                        const res = task.callback();
                        if (res instanceof Promise) {
                            res.catch((err) => {
                                console.error(`[XadyScheduler] Promise görev hatası (Modül: ${task.moduleName}):`, err);
                            });
                        }
                    } catch (err) {
                        console.error(`[XadyScheduler] Sync görev hatası (Modül: ${task.moduleName}):`, err);
                    }
                }

                // Handle repeating vs one-off
                if (task.intervalTicks > 0) {
                    task.remainingTicks = task.intervalTicks;
                } else {
                    this.tasks.delete(id);
                }
            }
        }
    }

    public schedule(
        moduleName: string,
        callback: () => void | Promise<void>,
        delayTicks: number,
        intervalTicks: number = 0,
        isAsync: boolean = false
    ): number {
        const id = this.nextTaskId++;
        const task: ScheduledTask = {
            id,
            moduleName,
            callback,
            isAsync,
            intervalTicks,
            remainingTicks: delayTicks <= 0 ? 1 : delayTicks,
            isCancelled: false
        };
        this.tasks.set(id, task);
        return id;
    }

    public cancelTask(id: number): boolean {
        const task = this.tasks.get(id);
        if (task) {
            task.isCancelled = true;
            this.tasks.delete(id);
            return true;
        }
        return false;
    }

    public cancelTasksByModule(moduleName: string) {
        for (const [id, task] of this.tasks.entries()) {
            if (task.moduleName === moduleName) {
                task.isCancelled = true;
                this.tasks.delete(id);
            }
        }
    }

    public getActiveTaskCount(moduleName?: string): number {
        if (!moduleName) return this.tasks.size;
        let count = 0;
        for (const task of this.tasks.values()) {
            if (task.moduleName === moduleName && !task.isCancelled) {
                count++;
            }
        }
        return count;
    }

    public shutdown() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        this.tasks.clear();
    }
}
