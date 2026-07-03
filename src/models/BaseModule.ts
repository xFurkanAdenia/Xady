import { EventEmitter } from "stream";
import ModuleManifest from "./ModuleManifest";
import Client from "../classes/Client";
import path from "path";
import fs from "fs";
import yaml from "yaml";
import AdmZip from "adm-zip";
import { PluginCommand } from "../command/PluginCommand";
import { FileConfiguration } from "../classes/FileConfiguration";

const constructorClients = new WeakMap<Function, Client>();

export default abstract class XadyModule extends EventEmitter {
    protected manifest!: ModuleManifest;
    protected client!: Client;
    #rawClient!: Client;
    protected execDir!: string;
    protected dataFolder!: string;
    protected xextPath!: string;
    private _config: FileConfiguration | null = null;
    private commands: Map<string, PluginCommand> = new Map();
    private chatPatterns: Map<string, RegExp> = new Map();
    private trackedTimeouts: Set<NodeJS.Timeout> = new Set();
    private trackedIntervals: Set<NodeJS.Timeout> = new Set();
    private _exports: Map<string, any> = new Map();
    #enabled: boolean = false;

    abstract onEnable(): void;
    abstract onDisable(): void;

    constructor(client: Client) {
        super();
        this.#rawClient = client;
        constructorClients.set(this.constructor, client);
        this.client = new Proxy(client, {
            get(target, prop) {
                const forbidden = [
                    'getModuleManager', 'getEventManager', 'getCommandManager', 
                    'getServiceManager', 'startBot', 'handleReconnect',
                    'registerPatternOwner', 'unregisterPatternOwner'
                ];
                if (typeof prop === 'string' && forbidden.includes(prop)) {
                    return () => { throw new Error(`Security Exception: client.${prop}() is restricted. Modifying core managers directly is not allowed.`); };
                }
                const value = Reflect.get(target, prop);
                return typeof value === 'function' ? value.bind(target) : value;
            },
            set(target, prop, value) {
                return false;
            },
            defineProperty(target, prop, descriptor) {
                return false;
            },
            deleteProperty(target, prop) {
                return false;
            },
            setPrototypeOf(target, prototype) {
                return false;
            }
        });
    }


    onLoad(): void { }

    setEnabled(enabled: boolean) {
        if(!enabled) {
            this.getClient().getEventManager().unregisterAll(this)
            this.getClient().getCommandManager().unregisterAll(this)
            this.unregisterAllChatPatterns()
            this.clearAllTrackedTimers()
            // Clear scheduled tasks
            try {
                const { XadyScheduler } = require("../classes/XadyScheduler");
                XadyScheduler.getInstance().cancelTasksByModule(this.getName());
            } catch (e) {}
        }
        if (enabled != this.#enabled) {
            this.#enabled = enabled;
            try {
                if (enabled) this.onEnable()
                else this.onDisable();
            } catch (err) {
                console.log(err)
                if (enabled) {
                    this.onDisable();
                    this.#enabled = false;
                }
            }
        }
    }

    // Spigot API: getServer()
    getServer() {
        return this.client.getBot();
    }

    // Mineflayer specific
    getBot() {
        return this.client.getBot();
    }

    getClient(): Client {
        return this.client;
    }

    // --- Zamanlayıcı (Timer) Yöneticileri (Memory Leak Koruması) ---
    
    setTimeout(callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]): NodeJS.Timeout {
        const timeout = setTimeout(() => {
            this.trackedTimeouts.delete(timeout);
            callback(...args);
        }, ms);
        this.trackedTimeouts.add(timeout);
        return timeout;
    }

    clearTimeout(timeoutId: NodeJS.Timeout): void {
        clearTimeout(timeoutId);
        this.trackedTimeouts.delete(timeoutId);
    }

    setInterval(callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]): NodeJS.Timeout {
        const interval = setInterval(callback, ms, ...args);
        this.trackedIntervals.add(interval);
        return interval;
    }

    clearInterval(intervalId: NodeJS.Timeout): void {
        clearInterval(intervalId);
        this.trackedIntervals.delete(intervalId);
    }

    private clearAllTrackedTimers(): void {
        for (const timeout of this.trackedTimeouts) {
            clearTimeout(timeout);
        }
        this.trackedTimeouts.clear();

        for (const interval of this.trackedIntervals) {
            clearInterval(interval);
        }
        this.trackedIntervals.clear();
    }

    // --- XadyScheduler (BukkitRunnable-style) API Entegrasyonu ---

    runTask(callback: () => void | Promise<void>): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, 0, 0, false);
    }

    runTaskLater(callback: () => void | Promise<void>, delayTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, 0, false);
    }

    runTaskTimer(callback: () => void | Promise<void>, delayTicks: number, intervalTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, intervalTicks, false);
    }

    runTaskAsync(callback: () => void | Promise<void>): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, 0, 0, true);
    }

    runTaskLaterAsync(callback: () => void | Promise<void>, delayTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, 0, true);
    }

    runTaskTimerAsync(callback: () => void | Promise<void>, delayTicks: number, intervalTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, intervalTicks, true);
    }

    cancelTask(taskId: number): boolean {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().cancelTask(taskId);
    }

    // -------------------------------------------------------------

    protected static getModule<T extends XadyModule>(prototype: string): T
    protected static getModule<T extends XadyModule>(prototype: (new () => T)): T
    protected static getModule<T extends XadyModule>(prototype: (new () => T) | string) {
        const client = constructorClients.get(this); if (!client) return; const moduleManager = client.getModuleManager();
        const modules = moduleManager.getModules();
        for(const [, module] of modules) {
            if (typeof prototype == "function" && (module instanceof prototype)) {
                return module;
            } else if(typeof prototype == "string") {
                return modules.get(prototype)
            }
        }
    }

    isEnabled() {
        return this.#enabled;
    }
    
    // Deprecated - backward compat
    getEnabled() {
        return this.#enabled;
    }
    
    // Deprecated - backward compat
    getModuleManifest() {
        return this.manifest;
    }
    
    // Deprecated - backward compat
    getExecDir() {
        return this.execDir;
    }

    getDescription() {
        return this.manifest;
    }

    getName(): string {
        return this.manifest.getName();
    }

    getDataFolder() {
        // MC Spigot pattern: Klasörü sadece ilk erişimde oluştur
        if (!fs.existsSync(this.dataFolder)) {
            fs.mkdirSync(this.dataFolder, { recursive: true });
        }
        return this.dataFolder;
    }

    // Spigot API: getCommand(name)
    getCommand(name: string): PluginCommand | null {
        return this.commands.get(name.toLowerCase()) || null;
    }

    _setCommand(name: string, command: PluginCommand) {
        this.commands.set(name.toLowerCase(), command);
    }

    getResource(filename: string): Buffer | null {
        if (!this.xextPath || !fs.existsSync(this.xextPath)) return null;
        try {
            const zip = new AdmZip(this.xextPath);
            const entry = zip.getEntry(filename);
            if (!entry) return null;
            return entry.getData();
        } catch (e) {
            console.error(`[XEXT] ${this.manifest.getName()} getResource hatası (${filename}):`, e);
            return null;
        }
    }

    saveResource(resourcePath: string, replace: boolean = false) {
        if (!this.xextPath || !this.dataFolder) return;
        
        // MC Spigot pattern: Klasörü sadece kayıt yapılırken oluştur
        if (!fs.existsSync(this.dataFolder)) {
            fs.mkdirSync(this.dataFolder, { recursive: true });
        }
        
        const targetPath = path.join(this.dataFolder, resourcePath);

        if (fs.existsSync(targetPath) && !replace) return;

        const buffer = this.getResource(resourcePath);
        if (!buffer) return;

        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        fs.writeFileSync(targetPath, buffer);
    }

    saveDefaultConfig() {
        this.saveResource("config.yml", false);
    }

    getConfig(): FileConfiguration {
        if (!this._config) {
            this.reloadConfig();
        }
        return this._config!;
    }

    reloadConfig() {
        const targetPath = this.dataFolder ? path.join(this.dataFolder, "config.yml") : "";
        this._config = new FileConfiguration(targetPath);
        if (targetPath) {
            this._config.load();
        }
    }

    saveConfig() {
        if (this._config) {
            this._config.save();
        }
    }

    registerEvents(listener: import("../event/Listener").Listener) {
        this.#rawClient.getEventManager().registerEvents(listener, this);
    }

    callEvent(event: import("../event/XadyEvent").XadyEvent) {
        return this.#rawClient.getEventManager().callEvent(event);
    }

    registerChatPattern(name: string, pattern: RegExp) {
        const bot = this.client.getBot();
        if (bot) {
            // Mineflayer'ın kendi içine aynı pattern'in 2 kere eklenmesini (spam yapmasını) kesin olarak engelle
            try { (bot as any)._internalRemoveChatPattern(name); } catch(e) {}

            (bot as any)._internalAddChatPattern(name, pattern, {
                parse: true,
                repeat: true
            });
        }

        this.chatPatterns.set(name, pattern);
        this.#rawClient.registerPatternOwner(name, this as any);
    }

    unregisterChatPattern(name: string) {
        const bot = this.client.getBot();
        if (bot) {
            (bot as any)._internalRemoveChatPattern(name);
        }

        this.chatPatterns.delete(name);
        this.#rawClient.unregisterPatternOwner(name);
    }

    unregisterAllChatPatterns() {
        const bot = this.client.getBot();
        for (const [name] of this.chatPatterns) {
            if (bot) (bot as any)._internalRemoveChatPattern(name);
            this.#rawClient.unregisterPatternOwner(name);
        }

        this.chatPatterns.clear();
    }

    getChatPatterns(): Map<string, RegExp> {
        return this.chatPatterns;
    }

    registerService<T>(
        serviceClass: new (...args: unknown[]) => T,
        service: T,
        priority?: number
    ): void {
        this.#rawClient.getServiceManager().register(serviceClass, service, this, priority);
    }

    unregisterService<T>(serviceClass: new (...args: unknown[]) => T): void {
        this.#rawClient.getServiceManager().unregister(serviceClass, this);
    }

    getService<T>(serviceClass: new (...args: unknown[]) => T): T | undefined {
        return this.#rawClient.getServiceManager().getService(serviceClass);
    }

    isServiceAvailable<T>(serviceClass: new (...args: unknown[]) => T): boolean {
        return this.#rawClient.getServiceManager().isServiceRegistered(serviceClass);
    }

    getLogger() {
        return {
            info: (msg: string) => console.log(`[${this.getName()}] ${msg}`),
            warn: (msg: string) => console.warn(`[${this.getName()}] ${msg}`),
            error: (msg: string) => console.error(`[${this.getName()}] ${msg}`),
            severe: (msg: string) => console.error(`[${this.getName()}][SEVERE] ${msg}`),
            fine: (msg: string) => console.log(`[${this.getName()}][FINE] ${msg}`),
            finest: (msg: string) => console.log(`[${this.getName()}][FINEST] ${msg}`)
        };
    }

    export(name: string, value: any): any {
        this._exports.set(name, value);
        return value;
    }

    getExport(name: string): any {
        return this._exports.get(name);
    }

    invoke(methodName: string, ...args: any[]): any {
        const method = this.getExport(methodName) || (this as any)[methodName];
        if (typeof method !== "function") {
            throw new Error(`Method ${methodName} is not exported or defined on module ${this.getName()}`);
        }
        return method(...args);
    }
}

// Backward compatibility
export { XadyModule as BaseModule };




