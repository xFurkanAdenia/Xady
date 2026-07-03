import BaseModule from "../models/BaseModule";
import { CommandExecutor } from "./CommandExecutor";
import { TabCompleter } from "./TabCompleter";
import CommandSender from "../models/CommandSender";

export class PluginCommand {
    private name: string;
    private description: string;
    private usageMessage: string;
    private permission: string | null;
    private permissionMessage: string;
    private aliases: string[];
    private module: BaseModule | null;

    private executor: CommandExecutor | null = null;
    private tabCompleter: TabCompleter | null = null;

    constructor(name: string, module: BaseModule | null = null) {
        this.name = name;
        this.module = module;
        this.description = "";
        this.usageMessage = `/${name}`;
        this.permission = null;
        this.permissionMessage = "Bu komutu kullanmak için gerekli yetkiye sahip değilsiniz.";
        this.aliases = [];
    }

    getName(): string { return this.name; }
    getModule(): BaseModule | null { return this.module; }

    getDescription(): string { return this.description; }
    setDescription(description: string): this { this.description = description; return this; }

    getUsage(): string { return this.usageMessage; }
    setUsage(usage: string): this { this.usageMessage = usage; return this; }

    getPermission(): string | null { return this.permission; }
    setPermission(permission: string | null): this { this.permission = permission; return this; }

    getPermissionMessage(): string { return this.permissionMessage; }
    setPermissionMessage(permissionMessage: string): this { this.permissionMessage = permissionMessage; return this; }

    getAliases(): string[] { return this.aliases; }
    setAliases(aliases: string[]): this { this.aliases = aliases; return this; }

    setExecutor(executor: CommandExecutor): this {
        this.executor = executor;
        return this;
    }

    getExecutor(): CommandExecutor | null {
        return this.executor;
    }

    setTabCompleter(tabCompleter: TabCompleter): this {
        this.tabCompleter = tabCompleter;
        return this;
    }

    getTabCompleter(): TabCompleter | null {
        return this.tabCompleter;
    }

    async execute(sender: CommandSender, label: string, args: string[]): Promise<boolean> {
        if (this.permission && !sender.hasPermission(this.permission)) {
            sender.sendMessage(this.permissionMessage);
            return true;
        }
        
        if (this.executor) {
            const success = await this.executor.onCommand(sender, this, label, args);
            if (!success && this.usageMessage) {
                sender.sendMessage(`Kullanım: ${this.usageMessage.replace("<command>", label)}`);
            }
            return success;
        }
        return false;
    }

    async tabComplete(sender: CommandSender, label: string, args: string[]): Promise<string[]> {
        if (this.permission && !sender.hasPermission(this.permission)) {
            return [];
        }

        if (this.tabCompleter) {
            return await this.tabCompleter.onTabComplete(sender, this, label, args);
        }
        return [];
    }
}

// Alias for Spigot compatibility
export { PluginCommand as ModuleCommand };
