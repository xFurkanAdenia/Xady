/**
 * Main Modules Command - Professional Module Management Console
 * 
 * Inspired by: Paper PluginManager, PlugMan, Spark, Bukkit Timings, Docker CLI
 */

import type Client from "../../classes/Client";
import { PluginCommand } from "../../command/PluginCommand";
import { CommandExecutor } from "../../command/CommandExecutor";
import { TabCompleter } from "../../command/TabCompleter";
import type CommandSender from "../../models/CommandSender";
import { SubCommandRegistry } from "./SubCommandRegistry";
import type { SubCommandContext } from "./types";

// Import all subcommands
import { ListSubCommand } from "./subcommands/ListSubCommand";
import { InfoSubCommand } from "./subcommands/InfoSubCommand";
import { StatusSubCommand } from "./subcommands/StatusSubCommand";
import { HealthSubCommand } from "./subcommands/HealthSubCommand";
import { EnableSubCommand } from "./subcommands/EnableSubCommand";
import { DisableSubCommand } from "./subcommands/DisableSubCommand";
import { ReloadSubCommand } from "./subcommands/ReloadSubCommand";
import { LoadSubCommand } from "./subcommands/LoadSubCommand";
import { UnloadSubCommand } from "./subcommands/UnloadSubCommand";
import { VerifySubCommand } from "./subcommands/VerifySubCommand";
import { TreeSubCommand } from "./subcommands/TreeSubCommand";
import { DepsSubCommand } from "./subcommands/DepsSubCommand";
import { ResourcesSubCommand } from "./subcommands/ResourcesSubCommand";
import { SearchSubCommand } from "./subcommands/SearchSubCommand";
import { HelpSubCommand } from "./subcommands/HelpSubCommand";

export type SettingsApiLike = {
    getConfig: () => Record<string, unknown>;
    set: (keyPath: string, value: unknown) => void;
};

export class ModulesCommandExecutor implements CommandExecutor, TabCompleter {
    readonly #client: Client;
    readonly #settings: SettingsApiLike;
    readonly #registry: SubCommandRegistry;
    
    constructor(client: Client, settings: SettingsApiLike) {
        this.#client = client;
        this.#settings = settings;
        this.#registry = new SubCommandRegistry();
        
        this.#registerSubCommands();
    }
    
    #registerSubCommands(): void {
        // Information & Listing
        this.#registry.register(new ListSubCommand());
        this.#registry.register(new InfoSubCommand());
        this.#registry.register(new SearchSubCommand());
        
        // Status & Health
        this.#registry.register(new StatusSubCommand());
        this.#registry.register(new HealthSubCommand());
        this.#registry.register(new VerifySubCommand());
        
        // Module Lifecycle
        this.#registry.register(new EnableSubCommand(this.#settings));
        this.#registry.register(new DisableSubCommand(this.#settings));
        this.#registry.register(new ReloadSubCommand(this.#settings));
        this.#registry.register(new LoadSubCommand());
        this.#registry.register(new UnloadSubCommand());
        
        // Dependencies & Resources
        this.#registry.register(new TreeSubCommand());
        this.#registry.register(new DepsSubCommand());
        this.#registry.register(new ResourcesSubCommand());
        
        // Help (should be last for proper ordering)
        this.#registry.register(new HelpSubCommand(this.#registry));
    }
    
    async onCommand(
        sender: CommandSender,
        command: PluginCommand,
        label: string,
        args: readonly string[]
    ): Promise<boolean> {
        const context: SubCommandContext = {
            client: this.#client,
            sender,
            command,
            label,
            args: Object.freeze([...args])
        };
        
        return await this.#registry.execute(context);
    }
    
    async onTabComplete(
        sender: CommandSender,
        command: PluginCommand,
        label: string,
        args: string[]
    ): Promise<string[]> {
        const context: SubCommandContext = {
            client: this.#client,
            sender,
            command,
            label,
            args: Object.freeze([...args])
        };
        
        const result = await this.#registry.tabComplete(context);
        return [...result];
    }
}

export default function registerModulesCommands(client: Client, settings: SettingsApiLike): void {
    const executor = new ModulesCommandExecutor(client, settings);
    
    const modulesCmd = new PluginCommand("modules")
        .setAliases(["module", "mod"])
        .setDescription("Professional module management console")
        .setUsage("/modules <subcommand> [args...]")
        .setExecutor(executor)
        .setTabCompleter(executor);
    
    client.getCommandManager().registerCommand(modulesCmd);
}
