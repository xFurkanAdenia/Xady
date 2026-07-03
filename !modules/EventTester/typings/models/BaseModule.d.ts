import { EventEmitter } from "stream";
import ModuleManifest from "./ModuleManifest";
import Client from "../classes/Client";
export default abstract class BaseModule extends EventEmitter {
    #private;
    protected manifest: ModuleManifest;
    protected client: Client;
    protected execDir: string;
    protected dataFolder: string;
    protected xextPath: string;
    private configData;
    abstract onEnable(): void;
    abstract onDisable(): void;
    constructor(client: Client);
    setEnabled(enabled: boolean): void;
    getClient(): Client;
    protected static getModule<T extends BaseModule>(prototype: string): T;
    protected static getModule<T extends BaseModule>(prototype: (new () => T)): T;
    getEnabled(): boolean;
    getModuleManifest(): ModuleManifest;
    getExecDir(): string;
    getDataFolder(): string;
    getResource(filename: string): Buffer | null;
    saveResource(resourcePath: string, replace?: boolean): void;
    saveDefaultConfig(): void;
    getConfig(): any;
    reloadConfig(): void;
    /**
     * Olay dinleyicilerini EventBus'a kaydeder.
     */
    registerEvents(listener: any): void;
    /**
     * Custom event'i EventBus'a dispatch eder.
     * Modüller kendi event'lerini tetikleyebilir.
     *
     * @example
     * const event = new MyCustomEvent("data");
     * this.callEvent(event);
     */
    callEvent(event: any): import("../event/XadyEvent").XadyEvent;
    /**
     * Bir servisi register eder.
     * Diğer modüller bu servisi kullanabilir.
     *
     * @example
     * this.registerService(EconomyService, new MyEconomyImpl(), ServicePriority.NORMAL);
     */
    registerService<T>(serviceClass: new (...args: any[]) => T, service: T, priority?: any): void;
    /**
     * Bir servisi unregister eder.
     */
    unregisterService<T>(serviceClass: new (...args: any[]) => T): void;
    /**
     * Bir servisi alır.
     *
     * @example
     * const economy = this.getService(EconomyService);
     * if (economy) {
     *     economy.addMoney(player, 100);
     * }
     */
    getService<T>(serviceClass: new (...args: any[]) => T): T | undefined;
    /**
     * Servis kayıtlı mı kontrol eder.
     */
    isServiceAvailable<T>(serviceClass: new (...args: any[]) => T): boolean;
}
