import { EventEmitter } from "stream";
import ModuleManifest from "./ModuleManifest";
import Client from "../classes/Client";
import path from "path";
import fs from "fs";
import yaml from "yaml";
import AdmZip from "adm-zip";
import { PluginCommand } from "../command/PluginCommand";
import { FileConfiguration } from "../classes/FileConfiguration";
import type { Listener } from "../event/Listener";
import type { XadyEvent } from "../event/XadyEvent";

type TaskCallback = () => void | Promise<void>;

interface ModuleLogger {
    readonly info: (msg: string) => void;
    readonly warn: (msg: string) => void;
    readonly error: (msg: string) => void;
    readonly severe: (msg: string) => void;
    readonly fine: (msg: string) => void;
    readonly finest: (msg: string) => void;
}

interface ProxySecurityHandler {
    get(target: Client, prop: string | symbol): unknown;
    set(): boolean;
    defineProperty(): boolean;
    deleteProperty(): boolean;
    setPrototypeOf(): boolean;
}

type ServiceConstructor<T> = new (...args: readonly unknown[]) => T;

const constructorClients = new WeakMap<Function, Client>();

export default abstract class XadyModule extends EventEmitter {
    protected manifest!: ModuleManifest;
    protected client!: Client;
    #rawClient!: Client;
    protected execDir!: string;
    protected dataFolder!: string;
    protected xextPath!: string;
    #config: FileConfiguration | null;
    readonly #commands: Map<string, PluginCommand>;
    readonly #chatPatterns: Map<string, RegExp>;
    readonly #trackedTimeouts: Set<NodeJS.Timeout>;
    readonly #trackedIntervals: Set<NodeJS.Timeout>;
    readonly #exports: Map<string, unknown>;
    #enabled: boolean;

    abstract onEnable(): void;
    abstract onDisable(): void;

    constructor(client: Client) {
        super();
        this.#config = null;
        this.#commands = new Map();
        this.#chatPatterns = new Map();
        this.#trackedTimeouts = new Set();
        this.#trackedIntervals = new Set();
        this.#exports = new Map();
        this.#enabled = false;
        
        this.#rawClient = client;
        constructorClients.set(this.constructor, client);
        
        const forbiddenMethods: readonly string[] = [
            'getModuleManager', 'getEventManager', 'getCommandManager', 
            'getServiceManager', 'startBot', 'handleReconnect',
            'registerPatternOwner', 'unregisterPatternOwner'
        ];
        
        this.client = new Proxy(client, {
            get(target: Client, prop: string | symbol): unknown {
                if (typeof prop === 'string' && forbiddenMethods.includes(prop)) {
                    return () => { throw new Error(`Security Exception: client.${prop}() is restricted. Modifying core managers directly is not allowed.`); };
                }
                const value = Reflect.get(target, prop);
                return typeof value === 'function' ? value.bind(target) : value;
            },
            set(): boolean {
                return false;
            },
            defineProperty(): boolean {
                return false;
            },
            deleteProperty(): boolean {
                return false;
            },
            setPrototypeOf(): boolean {
                return false;
            }
        });
    }

    onLoad(): void { }

    setEnabled(enabled: boolean): void {
        if(!enabled) {
            this.getClient().getEventManager().unregisterAll(this);
            this.getClient().getCommandManager().unregisterAll(this);
            this.unregisterAllChatPatterns();
            this.#clearAllTrackedTimers();
            // Clear scheduled tasks
            try {
                const { XadyScheduler } = require("../classes/XadyScheduler");
                XadyScheduler.getInstance().cancelTasksByModule(this.getName());
            } catch (e) {}
        }
        if (enabled !== this.#enabled) {
            this.#enabled = enabled;
            try {
                if (enabled) this.onEnable();
                else this.onDisable();
            } catch (err) {
                console.log(err);
                if (enabled) {
                    this.onDisable();
                    this.#enabled = false;
                }
            }
        }
    }

    // Spigot API: getServer()
    getServer(): import("../types").Bot | undefined {
        return this.client.getBot();
    }

    // Mineflayer specific
    getBot(): import("../types").Bot | undefined {
        return this.client.getBot();
    }

    getClient(): Client {
        return this.client;
    }

    // --- Zamanlayıcı (Timer) Yöneticileri (Memory Leak Koruması) ---
    
    setTimeout(callback: (...args: readonly unknown[]) => void, ms?: number, ...args: readonly unknown[]): NodeJS.Timeout {
        const timeout = setTimeout(() => {
            this.#trackedTimeouts.delete(timeout);
            callback(...args);
        }, ms);
        this.#trackedTimeouts.add(timeout);
        return timeout;
    }

    clearTimeout(timeoutId: NodeJS.Timeout): void {
        clearTimeout(timeoutId);
        this.#trackedTimeouts.delete(timeoutId);
    }

    setInterval(callback: (...args: readonly unknown[]) => void, ms?: number, ...args: readonly unknown[]): NodeJS.Timeout {
        const interval = setInterval(callback, ms, ...args);
        this.#trackedIntervals.add(interval);
        return interval;
    }

    clearInterval(intervalId: NodeJS.Timeout): void {
        clearInterval(intervalId);
        this.#trackedIntervals.delete(intervalId);
    }

    #clearAllTrackedTimers(): void {
        for (const timeout of this.#trackedTimeouts) {
            clearTimeout(timeout);
        }
        this.#trackedTimeouts.clear();

        for (const interval of this.#trackedIntervals) {
            clearInterval(interval);
        }
        this.#trackedIntervals.clear();
    }

    // --- XadyScheduler (BukkitRunnable-style) API Entegrasyonu ---

    runTask(callback: TaskCallback): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, 0, 0, false);
    }

    runTaskLater(callback: TaskCallback, delayTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, 0, false);
    }

    runTaskTimer(callback: TaskCallback, delayTicks: number, intervalTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, intervalTicks, false);
    }

    runTaskAsync(callback: TaskCallback): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, 0, 0, true);
    }

    runTaskLaterAsync(callback: TaskCallback, delayTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, 0, true);
    }

    runTaskTimerAsync(callback: TaskCallback, delayTicks: number, intervalTicks: number): number {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().schedule(this.getName(), callback, delayTicks, intervalTicks, true);
    }

    cancelTask(taskId: number): boolean {
        const { XadyScheduler } = require("../classes/XadyScheduler");
        return XadyScheduler.getInstance().cancelTask(taskId);
    }

    // -------------------------------------------------------------

    protected static getModule<T extends XadyModule>(prototype: string): T | undefined;
    protected static getModule<T extends XadyModule>(prototype: new () => T): T | undefined;
    protected static getModule<T extends XadyModule>(prototype: (new () => T) | string): T | undefined {
        const client = constructorClients.get(this); 
        if (!client) return undefined; 
        const moduleManager = client.getModuleManager();
        const modules = moduleManager.getModules();
        for(const [, module] of modules) {
            if (typeof prototype === "function" && (module instanceof prototype)) {
                return module as T;
            } else if(typeof prototype === "string") {
                return modules.get(prototype) as T | undefined;
            }
        }
        return undefined;
    }

    isEnabled(): boolean {
        return this.#enabled;
    }
    
    // Deprecated - backward compat
    getEnabled(): boolean {
        return this.#enabled;
    }
    
    // Deprecated - backward compat
    getModuleManifest(): ModuleManifest {
        return this.manifest;
    }
    
    // Deprecated - backward compat
    getExecDir(): string {
        return this.execDir;
    }

    getDescription(): ModuleManifest {
        return this.manifest;
    }

    getName(): string {
        return this.manifest.getName();
    }

    getDataFolder(): string {
        // MC Spigot pattern: Klasörü sadece ilk erişimde oluştur
        if (!fs.existsSync(this.dataFolder)) {
            fs.mkdirSync(this.dataFolder, { recursive: true });
        }
        return this.dataFolder;
    }

    // Spigot API: getCommand(name)
    getCommand(name: string): PluginCommand | null {
        return this.#commands.get(name.toLowerCase()) || null;
    }

    _setCommand(name: string, command: PluginCommand): void {
        this.#commands.set(name.toLowerCase(), command);
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

    saveResource(resourcePath: string, replace: boolean = false): void {
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

    saveDefaultConfig(): void {
        this.saveResource("config.yml", false);
    }

    getConfig(): FileConfiguration {
        if (!this.#config) {
            this.reloadConfig();
        }
        return this.#config!;
    }

    reloadConfig(): void {
        const targetPath = this.dataFolder ? path.join(this.dataFolder, "config.yml") : "";
        this.#config = new FileConfiguration();
        this.#config.setFile(targetPath);
        
        // Load defaults from resources first (Bukkit/Paper pattern)
        const defaultResource = this.getResource("config.yml");
        if (defaultResource) {
            try {
                const defaultContent = defaultResource.toString('utf-8');
                const defaultDoc = yaml.parseDocument(defaultContent, { keepSourceTokens: true, logLevel: 'silent' });
                const defaultData = defaultDoc.toJSON();
                if (defaultData && typeof defaultData === 'object') {
                    this.#config.addDefaultsFromMap(defaultData);
                }
            } catch (error) {
                console.error(`[${this.getName()}] Failed to load default config:`, error);
            }
        }
        
        // Enable copyDefaults BEFORE loading user config (Bukkit pattern)
        this.#config.options().copyDefaultsWith(true);
        
        // Then load and merge with existing config
        if (targetPath && fs.existsSync(targetPath)) {
            try {
                const content = fs.readFileSync(targetPath, 'utf-8');
                const doc = yaml.parseDocument(content, { keepSourceTokens: true, logLevel: 'silent' });
                const data = doc.toJSON();
                if (data && typeof data === 'object') {
                    (this.#config as FileConfiguration & { fromObject: (data: Record<string, unknown>) => void }).fromObject(data);
                }
                (this.#config as FileConfiguration & { _isDirty: boolean })._isDirty = false;
            } catch (error) {
                const err = error as NodeJS.ErrnoException;
                if (err.code !== 'ENOENT') {
                    console.error(`[${this.getName()}] Failed to load config:`, error);
                }
            }
        }
    }

    saveConfig(): void {
        if (this.#config && this.#config.getFile()) {
            try {
                const targetPath = this.#config.getFile()!;
                const data = (this.#config as FileConfiguration & { toObject: () => Record<string, unknown> }).toObject();
                const yamlStr = yaml.stringify(data, {
                    indent: 2,
                    lineWidth: 0,
                    minContentWidth: 0
                });
                
                fs.mkdirSync(path.dirname(targetPath), { recursive: true });
                fs.writeFileSync(targetPath, yamlStr, 'utf-8');
                (this.#config as FileConfiguration & { _isDirty: boolean })._isDirty = false;
            } catch (error) {
                console.error(`[${this.getName()}] Failed to save config:`, error);
            }
        }
    }

    registerEvents(listener: Listener): void {
        this.#rawClient.getEventManager().registerEvents(listener, this);
    }

    callEvent(event: XadyEvent): XadyEvent {
        return this.#rawClient.getEventManager().callEvent(event);
    }

    registerChatPattern(name: string, pattern: RegExp): void {
        const bot = this.client.getBot();
        if (bot) {
            // Mineflayer'ın kendi içine aynı pattern'in 2 kere eklenmesini (spam yapmasını) kesin olarak engelle
            try { (bot as { _internalRemoveChatPattern?: (name: string) => void })._internalRemoveChatPattern?.(name); } catch(e) {}

            (bot as { _internalAddChatPattern?: (name: string, pattern: RegExp, options: { parse: boolean; repeat: boolean }) => void })._internalAddChatPattern?.(name, pattern, {
                parse: true,
                repeat: true
            });
        }

        this.#chatPatterns.set(name, pattern);
        this.#rawClient.registerPatternOwner(name, this);
    }

    unregisterChatPattern(name: string): void {
        const bot = this.client.getBot();
        if (bot) {
            (bot as { _internalRemoveChatPattern?: (name: string) => void })._internalRemoveChatPattern?.(name);
        }

        this.#chatPatterns.delete(name);
        this.#rawClient.unregisterPatternOwner(name);
    }

    unregisterAllChatPatterns(): void {
        const bot = this.client.getBot();
        for (const [name] of this.#chatPatterns) {
            if (bot) (bot as { _internalRemoveChatPattern?: (name: string) => void })._internalRemoveChatPattern?.(name);
            this.#rawClient.unregisterPatternOwner(name);
        }

        this.#chatPatterns.clear();
    }

    getChatPatterns(): ReadonlyMap<string, RegExp> {
        return this.#chatPatterns;
    }

    registerService<T>(
        serviceClass: ServiceConstructor<T>,
        service: T,
        priority?: number
    ): void {
        this.#rawClient.getServiceManager().register(serviceClass, service, this, priority);
    }

    unregisterService<T>(serviceClass: ServiceConstructor<T>): void {
        this.#rawClient.getServiceManager().unregister(serviceClass, this);
    }

    getService<T>(serviceClass: ServiceConstructor<T>): T | undefined {
        return this.#rawClient.getServiceManager().getService(serviceClass);
    }

    isServiceAvailable<T>(serviceClass: ServiceConstructor<T>): boolean {
        return this.#rawClient.getServiceManager().isServiceRegistered(serviceClass);
    }

    getLogger(): ModuleLogger {
        const moduleName = this.getName();
        return {
            info: (msg: string): void => console.log(`[${moduleName}] ${msg}`),
            warn: (msg: string): void => console.warn(`[${moduleName}] ${msg}`),
            error: (msg: string): void => console.error(`[${moduleName}] ${msg}`),
            severe: (msg: string): void => console.error(`[${moduleName}][SEVERE] ${msg}`),
            fine: (msg: string): void => console.log(`[${moduleName}][FINE] ${msg}`),
            finest: (msg: string): void => console.log(`[${moduleName}][FINEST] ${msg}`)
        };
    }

    export(name: string, value: unknown): unknown {
        this.#exports.set(name, value);
        return value;
    }

    getExport(name: string): unknown {
        return this.#exports.get(name);
    }

    invoke(methodName: string, ...args: readonly unknown[]): unknown {
        const method = this.#exports.get(methodName) || (this as Record<string, unknown>)[methodName];
        if (typeof method !== "function") {
            throw new Error(`Method ${methodName} is not exported or defined on module ${this.getName()}`);
        }
        return (method as (...args: readonly unknown[]) => unknown)(...args);
    }
}

// Backward compatibility
export { XadyModule as BaseModule };




