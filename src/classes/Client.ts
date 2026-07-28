import { BotOptions } from "mineflayer";
import EventEmitter from "stream";
import ModuleManager from "./ModuleManager";
import CommandManager from "./CommandManager";
import createBot from "../functions/bot/createBot";
import { Bot, Events } from "../types";
import ConsoleCommandSender from "../models/ConsoleCommandSender";
import { error, xady } from "../utils/prefix";
import chalk from "chalk";
import { EventManager } from "../event/EventManager";
import { GenericMineflayerEvent } from "../event/mineflayer/GenericMineflayerEvent";
import { EVENT_MAP } from "../event/mineflayer/EventMapper";
import { ServiceManager } from "./ServiceManager";
import { ChatPatternEvent } from "../event/xady/ChatPatternEvent";
import { pathfinder } from "mineflayer-pathfinder";
import type BaseModule from "../models/BaseModule";

type ForbiddenBotMethod = 
    | "on" | "once" | "addListener" | "prependListener" | "prependOnceListener"
    | "removeListener" | "removeAllListeners" | "off" | "emit"
    | "end" | "quit" | "_client";

type ForbiddenClientMethod = 
    | 'getModuleManager' | 'getEventManager' | 'getCommandManager' 
    | 'getServiceManager' | 'startBot' | 'handleReconnect'
    | 'registerPatternOwner' | 'unregisterPatternOwner';

interface ReconnectConfig {
    maxReconnectAttempts?: number;
    reconnectDelay?: number;
}

interface BotConfig extends ReconnectConfig {
    username?: string;
    host?: string;
    port?: number;
    version?: string;
}

interface GlobalXady {
    settings?: {
        getConfig(): {
            bot?: BotConfig;
        };
    };
}

declare const globalThis: typeof global & {
    Xady?: GlobalXady;
};

export default class Client extends EventEmitter {
    #bot?: Bot;
    #safeBot?: Bot;
    #botOptions?: BotOptions;
    #reconnectAttempts: number;
    #reconnectTimeout?: NodeJS.Timeout;
    readonly #execDir: string;
    readonly #moduleManager: ModuleManager;
    readonly #commandManager: CommandManager;
    readonly #consoleCommandSender: ConsoleCommandSender;
    readonly #eventManager: EventManager;
    readonly #serviceManager: ServiceManager;
    readonly #patternOwners: Map<string, BaseModule>;

    constructor(execDir: string) {
        super();
        this.#reconnectAttempts = 0;
        this.#eventManager = new EventManager();
        this.#serviceManager = new ServiceManager();
        this.#moduleManager = new ModuleManager(this);
        this.#commandManager = new CommandManager(this);
        this.#execDir = execDir;
        this.#consoleCommandSender = new ConsoleCommandSender(this, "Console");
        this.#patternOwners = new Map();
    }
    startBot(options: BotOptions): void {
        if (this.#reconnectTimeout) clearTimeout(this.#reconnectTimeout);
        this.#botOptions = options;
        this.#bot = createBot(this, options);

        // Mineflayer adds these methods via prismarine-chat plugin later in the lifecycle.
        // We need to safely intercept them.
        const bot = this.#bot as Bot & {
            _internalAddChatPattern?: (name: string, pattern: RegExp, options: { parse: boolean; repeat: boolean }) => void;
            _internalAddChatPatternSet?: (name: string, patterns: RegExp[], options: { parse: boolean; repeat: boolean }) => void;
            _internalRemoveChatPattern?: (name: string) => void;
            addChatPattern?: (name: string, pattern: RegExp, options?: { parse?: boolean; repeat?: boolean }) => void;
            addChatPatternSet?: (name: string, patterns: RegExp[], options?: { parse?: boolean; repeat?: boolean }) => void;
            removeChatPattern?: (name: string) => void;
            setMaxListeners: (n: number) => void;
        };

        // Sınırsız event listener limitini artır, modüller çok fazla event eklediğinde "MaxListenersExceededWarning" vermesin
        bot.setMaxListeners(0);

        this.#bot.loadPlugin(pathfinder);

        const interceptChatPatternMethods = (): void => {
            if (typeof bot.addChatPattern === "function") {
                bot._internalAddChatPattern = bot.addChatPattern.bind(bot);
                bot._internalAddChatPatternSet = bot.addChatPatternSet?.bind(bot);
                bot._internalRemoveChatPattern = bot.removeChatPattern?.bind(bot);
                bot.addChatPattern = () => { throw new Error("bot.addChatPattern is disabled for security. Use module.registerChatPattern() instead."); };
                bot.addChatPatternSet = () => { throw new Error("bot.addChatPatternSet is disabled for security. Use module.registerChatPattern() instead."); };
                bot.removeChatPattern = () => { throw new Error("bot.removeChatPattern is disabled for security. Use module.unregisterChatPattern() instead."); };
            }
        };

        if (typeof bot.addChatPattern === "function") {
            interceptChatPatternMethods();
        } else {
            // Wait for the plugin to load them
            bot.once('inject_allowed', () => {
                interceptChatPatternMethods();
            });
        }

        this.#safeBot = new Proxy(this.#bot, {
            get(target: Bot, prop: string | symbol): unknown {
                const forbidden: readonly ForbiddenBotMethod[] = [
                    "on", "once", "addListener", "prependListener", "prependOnceListener",
                    "removeListener", "removeAllListeners", "off", "emit",
                    "end", "quit", "_client"
                ];
                if (typeof prop === "string" && forbidden.includes(prop as ForbiddenBotMethod)) {
                    return () => { throw new Error(`Security Exception: bot.${prop} is blocked. Use Xady module events/methods instead.`); };
                }
                const value = Reflect.get(target, prop);
                return typeof value === "function" ? value.bind(target) : value;
            },
            set(): boolean {
                console.warn(chalk.red(`[Güvenlik] Modül bağlamından bot nesnesinin özellikleri değiştirilemez.`));
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
            },
            ownKeys(target: Bot): ArrayLike<string | symbol> {
                // Hide forbidden properties in reflection
                const forbidden: readonly ForbiddenBotMethod[] = [
                    "on", "once", "addListener", "removeListener", "removeAllListeners", "emit",
                    "end", "quit", "_client"
                ];
                return Reflect.ownKeys(target).filter(k => typeof k !== "string" || !forbidden.includes(k as ForbiddenBotMethod));
            },
            getOwnPropertyDescriptor(target: Bot, prop: string | symbol): PropertyDescriptor | undefined {
                const forbidden: readonly ForbiddenBotMethod[] = [
                    "on", "once", "addListener", "removeListener", "removeAllListeners", "emit",
                    "end", "quit", "_client"
                ];
                if (typeof prop === "string" && forbidden.includes(prop as ForbiddenBotMethod)) {
                    return undefined;
                }
                return Reflect.getOwnPropertyDescriptor(target, prop);
            }
        });

        const originalEmit = this.#bot.emit.bind(this.#bot);
        this.#bot.emit = (eventName: string | symbol, ...args: readonly unknown[]): boolean => {
            const strName = String(eventName);
            try {
                const mapping = EVENT_MAP[strName];
                if (mapping) {
                    const eventArgs = mapping.argsMapper(...args);
                    const event = new mapping.EventClass(...eventArgs);
                    this.#eventManager.callEvent(event);
                    if ("isCancelled" in event && typeof event.isCancelled === "function" && event.isCancelled()) {
                        return false;
                    }
                } else if (strName.startsWith("chat:")) {
                    const patternName = strName.substring(5);

                    console.log("[DEBUG] Chat Pattern Fired:", patternName);

                    const firstArg = args[0];
                    if (Array.isArray(firstArg) && firstArg.length > 0) {
                        const matches = firstArg as RegExpMatchArray;
                        const owner = this.getPatternOwner(patternName);

                        console.log("[DEBUG] Owner:", owner?.getName?.());

                        if (owner) {
                            const chatPatternEvent = new ChatPatternEvent(
                                patternName,
                                matches,
                                owner
                            );

                            this.#eventManager.callEvent(chatPatternEvent);
                        }
                    }
                } else {
                    const generic = new GenericMineflayerEvent(strName, [...args]);
                    this.#eventManager.callEvent(generic);
                }
            } catch (err) {
                console.error(xady + error + chalk.redBright(`[EventBus] "${strName}" eventi islenirken hata olustu:`), err);
            }
            return originalEmit(eventName as keyof import("mineflayer").BotEvents, ...(args as Parameters<import("mineflayer").BotEvents[keyof import("mineflayer").BotEvents]>));
        };

        this.emit("botCreate");
        this.#bot.once("spawn", () => {
            this.#reconnectAttempts = 0;

            // Re-apply all chat patterns from all modules to the new bot instance
            for (const [, module] of this.#moduleManager.getModules()) {
                const patterns = (module as BaseModule & { getChatPatterns?: () => Map<string, RegExp> }).getChatPatterns?.() || new Map<string, RegExp>();
                for (const [name, pattern] of patterns) {
                    try {
                        // Güvenli silme: aynı isme sahip pattern varsa kaldır (duplikasyon engelleme)
                        try { (this.#bot as Bot & { _internalRemoveChatPattern?: (name: string) => void })._internalRemoveChatPattern?.(name); } catch (e) { }

                        (this.#bot as Bot & { _internalAddChatPattern?: (name: string, pattern: RegExp, options: { parse: boolean; repeat: boolean }) => void })._internalAddChatPattern?.(name, pattern, { parse: true, repeat: true });
                    } catch (e) {
                        console.error(`[Xady] Failed to re-apply chat pattern ${name} for module ${module.getName()}:`, e);
                    }
                }
            }

            // Xady modules may rely on Mineflayer events. To prevent duplicate events 
            // when the bot is re-created, we don't need to do anything special here 
            // because `EventManager` binds to `this.bot.emit` which is re-created per bot instance.
            // The previous bot is destroyed along with its `bot.emit` hooks.
            // However, module-level EventHandlers are cached in `EventManager`.

            this.emit("botSpawn");
            console.log("Bot Aktif!");
        })
            .on("message", (jsonMsg) => {
                console.log(jsonMsg.toAnsi());
            })
            .on("kicked", (reason) => {
                try {
                    const version = this.getBotOptions()?.version || "1.16.5";
                    // prismarine-chat sometimes crashes if not fully loaded or if reason is weird
                    let parsed: string | Record<string, unknown> = reason;
                    if (typeof reason === 'string') {
                        try { parsed = JSON.parse(reason) as Record<string, unknown>; } catch (e) { }
                    }

                    let msg = "";
                    try {
                        const registry = require("prismarine-registry")(version);
                        const ChatMessage = require("prismarine-chat")(registry);
                        const ansiMsg = new ChatMessage(parsed).toAnsi();
                        msg = ansiMsg ? ansiMsg : (typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason));
                    } catch (chatErr) {
                        msg = typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason);
                    }

                    console.log(xady + error + chalk.redBright("Bot sunucudan atıldı (Kicked)!\nSebep:\n" + msg));
                } catch (err) {
                    const fallbackMsg = typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason);
                    console.log(xady + error + chalk.redBright("Bot sunucudan atıldı (Kicked)!\nSebep:\n" + fallbackMsg));
                }
            })
            .on("end", (reason) => {
                // Sadece bot bilerek kapatılmadıysa (örneğin ayar değiştirip bağlanmıyorsak) handleReconnect yap
                if (!this.#botOptions) return;
                console.log(xady + error + chalk.redBright(`Bot bağlantısı koptu. (Sebep: ${reason})`));
                this.handleReconnect();
            })
            .on("error", (err) => {
                console.log(xady + error + chalk.redBright(`Bot Bağlantı Hatası: ${err.message}`));
            });
    }

    public handleReconnect(force: boolean = false): void {
        const globalCfg = (globalThis.Xady?.settings?.getConfig() || {}) as { bot?: BotConfig };
        const cfg = globalCfg.bot || {} as BotConfig;
        const maxAttempts = cfg.maxReconnectAttempts ?? 10;
        const delay = cfg.reconnectDelay ?? 5000;

        if (force) {
            this.#reconnectAttempts = 0; // Reset attempts on manual reconnect

            // Re-fetch bot options from config in case it was disconnected
            if (!this.#botOptions) {
                this.#botOptions = {
                    username: cfg.username || 'bot',
                    host: cfg.host || 'localhost',
                    port: cfg.port || 25565,
                    version: cfg.version || '1.16.5',
                    hideErrors: false,
                    keepAlive: true,
                    checkTimeoutInterval: 60 * 1000
                };
            }
        }

        if (maxAttempts !== -1 && this.#reconnectAttempts >= maxAttempts) {
            console.log(xady + error + chalk.redBright(`Maksimum yeniden bağlanma denemesine ulaşıldı (${maxAttempts}). Yeniden bağlanılmıyor.`));
            return;
        }

        this.#reconnectAttempts++;
        console.log(xady + chalk.yellowBright(`Sunucuya yeniden bağlanılıyor... (Deneme: ${this.#reconnectAttempts}${maxAttempts !== -1 ? `/${maxAttempts}` : ''}) - ${delay}ms beklenecek.`));

        if (this.#reconnectTimeout) clearTimeout(this.#reconnectTimeout);
        this.#reconnectTimeout = setTimeout(() => {
            // setTimeout çalıştığı anda ayarları YENİDEN okuyalım (dinamik olması için)
            const freshGlobalCfg = (globalThis.Xady?.settings?.getConfig() || {}) as { bot?: BotConfig };
            const freshCfg = freshGlobalCfg.bot || {} as BotConfig;
            const freshMaxAttempts = freshCfg.maxReconnectAttempts ?? 10;

            // Eğer aradan geçen sürede sınır aşılmışsa tekrar denemesin
            if (freshMaxAttempts !== -1 && this.#reconnectAttempts >= freshMaxAttempts) {
                console.log(xady + error + chalk.redBright(`Ayarlar güncellendi: Maksimum yeniden bağlanma denemesine ulaşıldı (${freshMaxAttempts}). İptal ediliyor.`));
                return;
            }

            if (this.#botOptions) {
                if (this.#bot) {
                    try { this.#bot.end(); } catch (e) { }
                    this.#bot.removeAllListeners();
                }
                this.startBot(this.#botOptions);
            }
        }, delay);
    }

    public disconnectBot(reason?: string): void {
        if (this.#reconnectTimeout) clearTimeout(this.#reconnectTimeout);
        this.#botOptions = undefined; // reconnect döngüsünü kırar
        if (this.#bot) {
            try { this.#bot.quit(reason); } catch (e) { }
            this.#bot.removeAllListeners();
        }
    }

    getModuleManager(): ModuleManager {
        return this.#moduleManager;
    }

    getCommandManager(): CommandManager {
        return this.#commandManager;
    }

    getEventManager(): EventManager {
        return this.#eventManager;
    }

    getServiceManager(): ServiceManager {
        return this.#serviceManager;
    }

    getExecDir(): string {
        return this.#execDir;
    }

    registerPatternOwner(name: string, module: BaseModule): void {
        this.#patternOwners.set(name, module);
    }

    unregisterPatternOwner(name: string): void {
        this.#patternOwners.delete(name);
    }

    getPatternOwner(name: string): BaseModule | undefined {
        return this.#patternOwners.get(name);
    }

    getBot(): Bot | undefined {
        return this.#safeBot;
    }
    
    getConsoleCommandSender(): ConsoleCommandSender {
        return this.#consoleCommandSender;
    }

    getBotOptions(): BotOptions | undefined {
        return this.#botOptions;
    }
    
    /**
     * Parse Minecraft chat component (NBT/JSON format) to plain text string
     * @param component - Chat component object from Minecraft protocol
     * @returns Plain text string
     */
    public parseChatComponent(component: unknown): string {
        if (!component) return '';
        if (typeof component === 'string') return component;
        
        try {
            const version = this.#botOptions?.version || "1.16.5";
            const registry = require("prismarine-registry")(version);
            const ChatMessage = require("prismarine-chat")(registry);
            const chatMsg = new ChatMessage(component);
            return chatMsg.toString();
        } catch (e) {
            // Fallback: Manual parse
            if (typeof component === 'object' && component !== null && 'value' in component) {
                const comp = component as { value?: { text?: { value?: string }; extra?: { value?: { text?: { value?: string } }[] } } };
                const text = comp.value?.text?.value || '';
                const extra = comp.value?.extra?.value || [];
                
                let result = text;
                for (const part of extra) {
                    if (part.text?.value) {
                        result += part.text.value;
                    }
                }
                return result;
            }
            return JSON.stringify(component);
        }
    }
    
    /**
     * Parse Minecraft chat component to ANSI colored string (for console)
     * @param component - Chat component object from Minecraft protocol
     * @returns ANSI colored string
     */
    public parseChatComponentAnsi(component: unknown): string {
        if (!component) return '';
        if (typeof component === 'string') return component;
        
        try {
            const version = this.#botOptions?.version || "1.16.5";
            const registry = require("prismarine-registry")(version);
            const ChatMessage = require("prismarine-chat")(registry);
            const chatMsg = new ChatMessage(component);
            return chatMsg.toAnsi();
        } catch (e) {
            return this.parseChatComponent(component);
        }
    }
    
    on<K extends keyof Events>(eventName: K, listener: (...args: Parameters<Events[K]>) => void): this {
        super.on(eventName, listener);
        return this;
    }
}
