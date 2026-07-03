import { BotOptions } from "mineflayer";
import EventEmitter from "stream";
import ModuleManager from "./ModuleManager";
import CommandManager from "./CommandManager";
import { Bot, Events } from "../types";
import ConsoleCommandSender from "../models/ConsoleCommandSender";
import { EventManager } from "../event/EventManager";
import { ServiceManager } from "./ServiceManager";
export default class Client extends EventEmitter {
    #private;
    private bot?;
    private botOptions?;
    private reconnectAttempts;
    private reconnectTimeout?;
    constructor(execDir: string);
    startBot(options: BotOptions): void;
    private handleReconnect;
    getModuleManager(): ModuleManager;
    getCommandManager(): CommandManager;
    getEventManager(): EventManager;
    getServiceManager(): ServiceManager;
    getExecDir(): string;
    getBot(): Bot | undefined;
    getConsoleCommandSender(): ConsoleCommandSender;
    getBotOptions(): BotOptions | undefined;
    on<K extends keyof Events>(eventName: K, listener: (...args: Parameters<Events[K]>) => void): this;
}
