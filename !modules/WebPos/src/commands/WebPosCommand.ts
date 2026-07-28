/**
 * WebPos Command - Main Entry Point
 */

import type WebPosModule from "../../index";

type CommandExecutor = {
    onCommand(sender: any, command: any, label: string, args: readonly string[]): Promise<boolean> | boolean;
};

type SubCommand = {
    readonly name: string;
    readonly aliases: readonly string[];
    readonly description: string;
    readonly usage: string;
    execute(sender: any, args: readonly string[]): Promise<boolean> | boolean;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> | readonly string[];
};

export class WebPosCommandExecutor implements CommandExecutor {
    readonly #module: WebPosModule;
    readonly #subcommands: Map<string, SubCommand>;
    readonly #aliases: Map<string, string>;
    
    constructor(module: WebPosModule, subcommands: SubCommand[]) {
        this.#module = module;
        this.#subcommands = new Map();
        this.#aliases = new Map();
        
        for (const sub of subcommands) {
            const name = sub.name.toLowerCase();
            this.#subcommands.set(name, sub);
            
            for (const alias of sub.aliases) {
                this.#aliases.set(alias.toLowerCase(), name);
            }
        }
    }
    
    onCommand(sender: any, command: any, label: string, args: readonly string[]): boolean {
        const subName = args[0]?.toLowerCase();
        
        if (!subName) {
            sender.sendMessage("§6WebPos Komutları:");
            for (const sub of this.#subcommands.values()) {
                sender.sendMessage(`§7  /${label} ${sub.name} §8- §f${sub.description}`);
            }
            return true;
        }
        
        // Find subcommand
        let subcommand = this.#subcommands.get(subName);
        if (!subcommand) {
            const mainName = this.#aliases.get(subName);
            if (mainName) {
                subcommand = this.#subcommands.get(mainName);
            }
        }
        
        if (!subcommand) {
            sender.sendMessage(`§cBilinmeyen alt komut: ${subName}`);
            sender.sendMessage(`§7Kullanım: /${label} help`);
            return true;
        }
        
        // Execute subcommand synchronously or handle promise
        const result = subcommand.execute(sender, args.slice(1));
        if (result instanceof Promise) {
            result.catch(err => {
                sender.sendMessage(`§cHata: ${err.message}`);
            });
            return true;
        }
        return result;
    }
    
    onTabComplete(sender: any, command: any, label: string, args: string[]): string[] {
        if (args.length === 0) {
            return [];
        }
        
        if (args.length === 1 && args[0] === '') {
            return Array.from(this.#subcommands.keys()).sort();
        }
        
        if (args.length === 1) {
            const prefix = args[0].toLowerCase();
            return Array.from(this.#subcommands.keys())
                .filter(name => name.startsWith(prefix))
                .sort();
        }
        
        // Delegate to subcommand
        const subName = args[0].toLowerCase();
        let subcommand = this.#subcommands.get(subName);
        if (!subcommand) {
            const mainName = this.#aliases.get(subName);
            if (mainName) {
                subcommand = this.#subcommands.get(mainName);
            }
        }
        
        if (!subcommand) {
            return [];
        }
        
        const result = subcommand.tabComplete(sender, args.slice(1));
        if (result instanceof Promise) {
            return [];
        }
        return [...result];
    }
    
    getModule(): WebPosModule {
        return this.#module;
    }
}
