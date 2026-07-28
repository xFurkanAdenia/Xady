/**
 * SubCommand Registry - Central registration and dispatch system
 */

import type { SubCommand, SubCommandContext } from "./types";
import { startsWithIgnoreCase } from "./utils/moduleUtils";

export class SubCommandRegistry {
    readonly #subcommands: Map<string, SubCommand>;
    readonly #aliases: Map<string, string>;
    
    constructor() {
        this.#subcommands = new Map();
        this.#aliases = new Map();
    }
    
    register(subcommand: SubCommand): void {
        const name = subcommand.name.toLowerCase();
        
        if (this.#subcommands.has(name)) {
            throw new Error(`SubCommand '${name}' is already registered`);
        }
        
        this.#subcommands.set(name, subcommand);
        
        for (const alias of subcommand.aliases) {
            const aliasLower = alias.toLowerCase();
            if (this.#aliases.has(aliasLower)) {
                throw new Error(`Alias '${alias}' is already registered`);
            }
            this.#aliases.set(aliasLower, name);
        }
    }
    
    get(nameOrAlias: string): SubCommand | undefined {
        const key = nameOrAlias.toLowerCase();
        
        // Direct lookup
        const direct = this.#subcommands.get(key);
        if (direct) return direct;
        
        // Alias lookup
        const mainName = this.#aliases.get(key);
        if (mainName) {
            return this.#subcommands.get(mainName);
        }
        
        return undefined;
    }
    
    getAll(): readonly SubCommand[] {
        return Object.freeze([...this.#subcommands.values()]);
    }
    
    getAllNames(): readonly string[] {
        return Object.freeze([...this.#subcommands.keys()]);
    }
    
    findByPrefix(prefix: string): readonly SubCommand[] {
        const prefixLower = prefix.toLowerCase();
        const matches: SubCommand[] = [];
        
        for (const [name, subcommand] of this.#subcommands) {
            if (startsWithIgnoreCase(name, prefixLower)) {
                matches.push(subcommand);
            }
        }
        
        return Object.freeze(matches);
    }
    
    async execute(context: SubCommandContext): Promise<boolean> {
        const args = context.args;
        const subcommandName = args[0]?.toLowerCase();
        
        if (!subcommandName) {
            // Show help by default
            const helpCmd = this.get('help');
            if (helpCmd) {
                return await helpCmd.execute({ ...context, args: [] });
            }
            return false;
        }
        
        const subcommand = this.get(subcommandName);
        
        if (!subcommand) {
            context.sender.sendMessage(`§cUnknown subcommand: ${subcommandName}`);
            context.sender.sendMessage(`§7Type '/modules help' for available commands.`);
            return true;
        }
        
        // Create new context with shifted args
        const subContext: SubCommandContext = {
            ...context,
            args: Object.freeze(args.slice(1))
        };
        
        return await subcommand.execute(subContext);
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        const args = context.args;
        
        // If no args at all, return empty (user hasn't typed space yet)
        if (args.length === 0) {
            return Object.freeze([]);
        }
        
        // If first arg is empty string (user typed space), show all subcommands
        if (args.length === 1 && args[0] === '') {
            const names = this.getAllNames();
            return Object.freeze([...names].sort());
        }
        
        // Complete subcommand name (partial match)
        if (args.length === 1) {
            const prefix = args[0];
            const names = this.getAllNames();
            return Object.freeze(
                names.filter(name => startsWithIgnoreCase(name, prefix)).sort()
            );
        }
        
        // Delegate to subcommand (args.length >= 2)
        const subcommandName = args[0];
        const subcommand = this.get(subcommandName);
        
        if (!subcommand) {
            return Object.freeze([]);
        }
        
        const subContext: SubCommandContext = {
            ...context,
            args: Object.freeze(args.slice(1))
        };
        
        return await subcommand.tabComplete(subContext);
    }
}
