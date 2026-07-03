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

export default class Client extends EventEmitter {
    private bot?: Bot;
    private safeBot?: Bot;
    private botOptions?: BotOptions;
    private reconnectAttempts: number = 0;
    private reconnectTimeout?: NodeJS.Timeout;
    #execDir: string;
    #moduleManager: ModuleManager;
    #commandManager: CommandManager;
    #consoleCommandSender: ConsoleCommandSender;
    #eventManager: EventManager;
    #serviceManager: ServiceManager;
    private patternOwners: Map<string, import("../models/BaseModule").default> = new Map();

    constructor(execDir: string) {
        super();
        this.#eventManager = new EventManager();
        this.#serviceManager = new ServiceManager();
        this.#moduleManager = new ModuleManager(this);
        this.#commandManager = new CommandManager(this);
        this.#execDir = execDir;
        this.#consoleCommandSender = new ConsoleCommandSender(this, "Console");
    }
    startBot(options: BotOptions) {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.botOptions = options;
        this.bot = createBot(this, options);

        // Mineflayer adds these methods via prismarine-chat plugin later in the lifecycle.
        // We need to safely intercept them.
        const bot = this.bot as any;

        // Sınırsız event listener limitini artır, modüller çok fazla event eklediğinde "MaxListenersExceededWarning" vermesin
        bot.setMaxListeners(0);

        if (typeof bot.addChatPattern === "function") {
            bot._internalAddChatPattern = bot.addChatPattern.bind(bot);
            bot._internalAddChatPatternSet = bot.addChatPatternSet.bind(bot);
            bot._internalRemoveChatPattern = bot.removeChatPattern.bind(bot);

            bot.addChatPattern = () => { throw new Error("bot.addChatPattern is disabled for security. Use module.registerChatPattern() instead."); };
            bot.addChatPatternSet = () => { throw new Error("bot.addChatPatternSet is disabled for security. Use module.registerChatPattern() instead."); };
            bot.removeChatPattern = () => { throw new Error("bot.removeChatPattern is disabled for security. Use module.unregisterChatPattern() instead."); };
        } else {
            // Wait for the plugin to load them
            bot.once('inject_allowed', () => {
                if (typeof bot.addChatPattern === "function") {
                    bot._internalAddChatPattern = bot.addChatPattern.bind(bot);
                    bot._internalAddChatPatternSet = bot.addChatPatternSet.bind(bot);
                    bot._internalRemoveChatPattern = bot.removeChatPattern.bind(bot);

                    bot.addChatPattern = () => { throw new Error("bot.addChatPattern is disabled for security. Use module.registerChatPattern() instead."); };
                    bot.addChatPatternSet = () => { throw new Error("bot.addChatPatternSet is disabled for security. Use module.registerChatPattern() instead."); };
                    bot.removeChatPattern = () => { throw new Error("bot.removeChatPattern is disabled for security. Use module.unregisterChatPattern() instead."); };
                }
            });
        }

        this.safeBot = new Proxy(this.bot, {
            get(target, prop) {
                const forbidden = [
                    "on", "once", "addListener", "prependListener", "prependOnceListener",
                    "removeListener", "removeAllListeners", "off", "emit",
                    "end", "quit"
                ];
                if (typeof prop === "string" && forbidden.includes(prop)) {
                    return () => { throw new Error(`Security Exception: bot.${prop} is blocked. Use Xady module events/methods instead.`); };
                }
                const value = Reflect.get(target, prop);
                return typeof value === "function" ? value.bind(target) : value;
            },
            set(target, prop, value) {
                console.warn(chalk.red(`[Güvenlik] Modül bağlamından bot nesnesinin özellikleri değiştirilemez.`));
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
            },
            ownKeys(target) {
                // Hide forbidden properties in reflection
                const forbidden = [
                    "on", "once", "addListener", "removeListener", "removeAllListeners", "emit",
                    "end", "quit", "_client"
                ];
                return Reflect.ownKeys(target).filter(k => typeof k !== "string" || !forbidden.includes(k));
            },
            getOwnPropertyDescriptor(target, prop) {
                const forbidden = [
                    "on", "once", "addListener", "removeListener", "removeAllListeners", "emit",
                    "end", "quit", "_client"
                ];
                if (typeof prop === "string" && forbidden.includes(prop)) {
                    return undefined;
                }
                return Reflect.getOwnPropertyDescriptor(target, prop);
            }
        });

        const originalEmit = this.bot.emit.bind(this.bot);
        this.bot.emit = (eventName: string | symbol, ...args: any[]) => {
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

                    const matches = args[0][0];
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
                } else {
                    const generic = new GenericMineflayerEvent(strName, args);
                    this.#eventManager.callEvent(generic);
                }
            } catch (err) {
                console.error(xady + error + chalk.redBright(`[EventBus] "${strName}" eventi islenirken hata olustu:`), err);
            }
            return originalEmit(eventName as any, ...args);
        };

        this.emit("botCreate")
        this.bot.once("spawn", () => {
            this.reconnectAttempts = 0;

            // Re-apply all chat patterns from all modules to the new bot instance
            for (const [, module] of this.#moduleManager.getModules()) {
                const patterns = (module as any).getChatPatterns?.() || new Map<string, RegExp>();
                for (const [name, pattern] of patterns) {
                    try {
                        // Güvenli silme: aynı isme sahip pattern varsa kaldır (duplikasyon engelleme)
                        try { (this.bot as any)._internalRemoveChatPattern(name); } catch (e) { }

                        (this.bot as any)._internalAddChatPattern(name, pattern, { parse: true, repeat: true });
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
                    let parsed = reason;
                    if (typeof reason === 'string') {
                        try { parsed = JSON.parse(reason); } catch (e) { }
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
                    let fallbackMsg = typeof reason === 'object' ? JSON.stringify(reason, null, 2) : String(reason);
                    console.log(xady + error + chalk.redBright("Bot sunucudan atıldı (Kicked)!\nSebep:\n" + fallbackMsg));
                }
            })
            .on("end", (reason) => {
                // Sadece bot bilerek kapatılmadıysa (örneğin ayar değiştirip bağlanmıyorsak) handleReconnect yap
                if (!this.botOptions) return;
                console.log(xady + error + chalk.redBright(`Bot bağlantısı koptu. (Sebep: ${reason})`));
                this.handleReconnect();
            })
            .on("error", (err) => {
                console.log(xady + error + chalk.redBright(`Bot Bağlantı Hatası: ${err.message}`));
            });
    }

    public handleReconnect(force: boolean = false) {
        const cfg = (globalThis as any).Xady?.settings?.getConfig()?.bot || {};
        const maxAttempts = cfg.maxReconnectAttempts ?? 10;
        const delay = cfg.reconnectDelay ?? 5000;

        if (force) {
            this.reconnectAttempts = 0; // Reset attempts on manual reconnect

            // Re-fetch bot options from config in case it was disconnected
            if (!this.botOptions) {
                this.botOptions = {
                    username: cfg.username,
                    host: cfg.host,
                    port: cfg.port,
                    version: cfg.version,
                    hideErrors: false,
                    keepAlive: true,
                    checkTimeoutInterval: 60 * 1000
                };
            }
        }

        if (maxAttempts !== -1 && this.reconnectAttempts >= maxAttempts) {
            console.log(xady + error + chalk.redBright(`Maksimum yeniden bağlanma denemesine ulaşıldı (${maxAttempts}). Yeniden bağlanılmıyor.`));
            return;
        }

        this.reconnectAttempts++;
        console.log(xady + chalk.yellowBright(`Sunucuya yeniden bağlanılıyor... (Deneme: ${this.reconnectAttempts}${maxAttempts !== -1 ? `/${maxAttempts}` : ''}) - ${delay}ms beklenecek.`));

        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => {
            // setTimeout çalıştığı anda ayarları YENİDEN okuyalım (dinamik olması için)
            const freshCfg = (globalThis as any).Xady?.settings?.getConfig()?.bot || {};
            const freshMaxAttempts = freshCfg.maxReconnectAttempts ?? 10;

            // Eğer aradan geçen sürede sınır aşılmışsa tekrar denemesin
            if (freshMaxAttempts !== -1 && this.reconnectAttempts >= freshMaxAttempts) {
                console.log(xady + error + chalk.redBright(`Ayarlar güncellendi: Maksimum yeniden bağlanma denemesine ulaşıldı (${freshMaxAttempts}). İptal ediliyor.`));
                return;
            }

            if (this.botOptions) {
                if (this.bot) {
                    try { this.bot.end(); } catch (e) { }
                    this.bot.removeAllListeners();
                }
                this.startBot(this.botOptions);
            }
        }, delay);
    }

    public disconnectBot(reason?: string) {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        this.botOptions = undefined; // reconnect döngüsünü kırar
        if (this.bot) {
            try { this.bot.quit(reason); } catch (e) { }
            this.bot.removeAllListeners();
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

    registerPatternOwner(name: string, module: import("../models/BaseModule").default) {
        this.patternOwners.set(name, module);
    }

    unregisterPatternOwner(name: string) {
        this.patternOwners.delete(name);
    }

    getPatternOwner(name: string): import("../models/BaseModule").default | undefined {
        return this.patternOwners.get(name);
    }

    getBot(): Bot | undefined {
        return this.safeBot;
    }
    getConsoleCommandSender(): ConsoleCommandSender {
        return this.#consoleCommandSender;
    }

    getBotOptions(): BotOptions | undefined {
        return this.botOptions;
    }
    on<K extends keyof Events>(eventName: K, listener: (...args: Parameters<Events[K]>) => void): this {
        super.on(eventName, listener);
        return this
    }
}
