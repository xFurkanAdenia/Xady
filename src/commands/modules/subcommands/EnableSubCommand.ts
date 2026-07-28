/**
 * Enable a disabled module
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { findModule, filterModulesByPrefix, sortModules } from "../utils/moduleUtils";
import type { SettingsApiLike } from "../ModulesCommand";
import chalk from "chalk";

export class EnableSubCommand extends SubCommand {
    readonly name = 'enable';
    readonly aliases = Object.freeze(['e', 'on']) as readonly string[];
    readonly description = 'Enable a disabled module';
    readonly usage = '/modules enable <module>';
    readonly permission = 'xady.modules.enable';
    readonly examples = Object.freeze([
        '/modules enable Economy',
        '/modules e Chat'
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
        
        if (module.isEnabled()) {
            this.sendMessage(context, chalk.yellow(`Module '${name}' is already enabled.`));
            return true;
        }
        
        try {
            module.setEnabled(true);
            
            // Update config
            const cfg = this.#settings.getConfig() as { modules?: { disabled?: unknown } };
            const disabled: string[] = Array.isArray(cfg?.modules?.disabled) ? [...(cfg.modules.disabled as string[])] : [];
            const filtered = disabled.filter(n => n.toLowerCase() !== name.toLowerCase());
            this.#settings.set("modules.disabled", filtered.sort());
            
            this.sendMessage(context, chalk.green(`✔ Module '${name}' has been enabled.`));
        } catch (error) {
            this.sendMessage(context, chalk.red(`✖ Failed to enable module '${name}': ${error}`));
        }
        
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const modules = context.client.getModuleManager().getModules();
        const disabledModules: string[] = [];
        
        for (const [name, mod] of modules) {
            if (!mod.isEnabled()) {
                disabledModules.push(name);
            }
        }
        
        const prefix = context.args[0] || '';
        return Object.freeze(sortModules(filterModulesByPrefix(disabledModules, prefix)));
    }
}
