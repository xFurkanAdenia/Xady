/**
 * Reload a module or all modules
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { findModule, filterModulesByPrefix, sortModules, getLoadOrder } from "../utils/moduleUtils";
import type { SettingsApiLike } from "../ModulesCommand";
import chalk from "chalk";

export class ReloadSubCommand extends SubCommand {
    readonly name = 'reload';
    readonly aliases = Object.freeze(['r', 'restart']) as readonly string[];
    readonly description = 'Reload a module or all modules';
    readonly usage = '/modules reload <module|all>';
    readonly permission = 'xady.modules.reload';
    readonly examples = Object.freeze([
        '/modules reload Economy',
        '/modules reload all',
        '/modules r Chat'
    ]) as readonly string[];
    
    readonly #settings: SettingsApiLike;
    
    constructor(settings: SettingsApiLike) {
        super();
        this.#settings = settings;
    }
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const target = context.args[0];
        if (!target) {
            this.sendMessage(context, `§cUsage: ${this.usage}`);
            return true;
        }
        
        // Reload all modules
        if (target.toLowerCase() === 'all') {
            return await this.#reloadAll(context);
        }
        
        // Reload single module
        return await this.#reloadSingle(context, target);
    }
    
    async #reloadSingle(context: SubCommandContext, moduleName: string): Promise<boolean> {
        const module = findModule(context.client, moduleName);
        if (!module) {
            this.sendMessage(context, `§cModule '${moduleName}' not found.`);
            return true;
        }
        
        const name = module.getName();
        const wasEnabled = module.isEnabled();
        
        this.sendMessage(context, chalk.cyan(`↻ Reloading module '${name}'...`));
        
        try {
            if (wasEnabled) {
                module.setEnabled(false);
            }
            
            // Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (wasEnabled) {
                module.setEnabled(true);
            }
            
            this.sendMessage(context, chalk.green(`✔ Module '${name}' reloaded successfully.`));
        } catch (error) {
            this.sendMessage(context, chalk.red(`✖ Failed to reload module '${name}': ${error}`));
        }
        
        return true;
    }
    
    async #reloadAll(context: SubCommandContext): Promise<boolean> {
        const modules = context.client.getModuleManager().getModules();
        const loadOrder = getLoadOrder(context.client);
        
        this.sendMessage(context, chalk.cyan(`↻ Reloading all modules (${modules.size})...`));
        
        const enabledStates = new Map<string, boolean>();
        
        // Record enabled states
        for (const [name, mod] of modules) {
            enabledStates.set(name, mod.isEnabled());
        }
        
        // Disable in reverse dependency order
        const reverseOrder = [...loadOrder].reverse();
        for (const name of reverseOrder) {
            const mod = modules.get(name);
            if (mod && mod.isEnabled()) {
                try {
                    mod.setEnabled(false);
                } catch (error) {
                    this.sendMessage(context, chalk.yellow(`⚠ Failed to disable '${name}': ${error}`));
                }
            }
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Enable in dependency order
        let successCount = 0;
        let failCount = 0;
        
        for (const name of loadOrder) {
            const mod = modules.get(name);
            const shouldBeEnabled = enabledStates.get(name);
            
            if (mod && shouldBeEnabled) {
                try {
                    mod.setEnabled(true);
                    successCount++;
                } catch (error) {
                    this.sendMessage(context, chalk.red(`  ✖ ${name}: ${error}`));
                    failCount++;
                }
            }
        }
        
        this.sendMessage(context, '');
        this.sendMessage(context, chalk.green(`✔ Reload complete: ${successCount} enabled, ${failCount} failed.`));
        
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const modules = context.client.getModuleManager().getModules();
        const names = ['all', ...Array.from(modules.keys())];
        const prefix = context.args[0] || '';
        
        return Object.freeze(sortModules(filterModulesByPrefix(names, prefix)));
    }
}
