declare namespace Xady {
    export class Module {
        onEnable(): void;
        onDisable(): void;
        getClient(): Client;
        getName(): string;
        getDataFolder(): string;
        getConfig(): any;
        saveDefaultConfig(): void;
        reloadConfig(): void;
        saveConfig(): void;
        getResource(path: string): Buffer | null;
        registerEvents(listener: Listener): void;
        protected static getModule<T extends Module>(name: string): T | undefined;
    }

    export class PluginCommand {
        constructor(name: string, module: Module);
        setExecutor(executor: any): this;
        setTabCompleter(completer: any): this;
    }

    export function EventHandler(priority?: EventPriority): MethodDecorator;

    export enum EventPriority {
        LOWEST = 0,
        LOW = 1,
        NORMAL = 2,
        HIGH = 3,
        HIGHEST = 4,
        MONITOR = 5
    }

    export interface Listener {}

    export namespace events {
        export class MessageEvent {
            getMessage(): string;
            getPlayer(): any;
        }
        
        export class MessageStrEvent {
            getMessage(): string;
            getPlayer(): any;
        }
        
        export class UnmatchedMessageEvent {
            getMessage(): string;
        }
        
        export class PlayerChatEvent {
            getPlayer(): any;
            getMessage(): string;
        }
    }
}

interface Client {
    getBot(): any;
    getCommandManager(): CommandManager;
}

interface CommandManager {
    registerCommand(command: any): void;
}

declare module '../WebPanel' {
    class WebPanelModule extends Xady.Module {
        webApi?: any;
    }
    export = WebPanelModule;
}
