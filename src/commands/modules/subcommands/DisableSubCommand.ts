/**
 * Disable an enabled module
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { findModule, filterModulesByPrefix, sortModules } from "../utils/moduleUtils";
import type { SettingsApiLike } from "../ModulesCommand";
import chalk from "chalk";

export class DisableSubCommand extends SubCommand {
    readonly name = 'disable';
    readonly aliases = Object.freeze(['d', 'off']) as readonly string[];
    readonly description = 'Disable an enabled module';
    readonly usage = '/modules disable <module>';
    readonly permission = 'xady.modules.disable';
    readonly examples = Object.freeze([
        '/modules disable Economy',
        '/modules d Chat'
    ]) as readonly string[];
    
    readonly #settings: SettingsApiLike;
    
    constructor(settings: SettingsApiLike) {
        super();
        this.#settings = settings;
    }
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const moduleName = context.args[0];
        if (!moduleName) {
            this.sendMessage(context, `§cUsage: ${this.usage}`);
            return true;
        }
        
        const module = findModule(context.client, moduleName);
        if (!module) {
            this.sendMessage(context, `§cModule '${moduleName}' not found.`);
            return true;
        }
        
        const name = module.getName();
        
        if (!module.isEnabled()) {
            this.sendMessage(context, chalk.yellow(`Module '${name}' is already disabled.`));
            return true;
        }
        
        try {
            module.setEnabled(false);
            
            // Update config
            const cfg = this.#settings.getConfig() as { modules?: { disabled?: unknown } };
            const disabled: string[] = Array.isArray(cfg?.modules?.disabled) ? [...(cfg.modules.disabled as string[])] : [];
            const set = new Set(disabled.map(n => n.toLowerCase()));
            set.add(name.toLowerCase());
            this.#settings.set("modules.disabled", Array.from(set).sort());
            
            this.sendMessage(context, chalk.green(`✔ Module '${name}' has been disabled.`));
        } catch (error) {
            this.sendMessage(context, chalk.red(`✖ Failed to disable module '${name}': ${error}`));
        }
        
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const modules = context.client.getModuleManager().getModules();
        const enabledModules: string[] = [];
        
        for (const [name, mod] of modules) {
            if (mod.isEnabled()) {
                enabledModules.push(name);
            }
        }
        
        const prefix = context.args[0] || '';
        return Object.freeze(sortModules(filterModulesByPrefix(enabledModules, prefix)));
    }
}
