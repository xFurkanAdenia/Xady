/**
 * Unload a module
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import chalk from "chalk";
import { findModule, getAllModules, buildDependencyGraph } from "../utils/moduleUtils";

export class UnloadSubCommand extends SubCommand {
    readonly name = 'unload';
    readonly aliases = Object.freeze(['u']) as readonly string[];
    readonly description = 'Unload a module';
    readonly usage = '/modules unload <module>';
    readonly permission = 'xady.modules.unload';
    readonly examples = Object.freeze([
        '/modules unload TestModule',
        '/modules u MyPlugin'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const moduleName = context.args[0];
        
        if (!moduleName) {
            this.sendMessage(context, chalk.red('Usage: /modules unload <module>'));
            return true;
        }
        
        const module = findModule(context.client, moduleName);
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const actualName = module.getDescription().getName();
        
        // Check for dependent modules
        const graph = buildDependencyGraph(context.client, actualName);
        
        if (graph.reverseDependencies.length > 0) {
            this.sendMessage(context, chalk.red(`Cannot unload '${actualName}' - other modules depend on it:`));
            for (const dep of graph.reverseDependencies) {
                this.sendMessage(context, chalk.gray(`  • ${dep}`));
            }
            this.sendMessage(context, chalk.yellow('Unload dependent modules first.'));
            return true;
        }
        
        this.sendMessage(context, chalk.yellow(`Unloading module: ${actualName}...`));
        
        try {
            const moduleManager = context.client.getModuleManager();
            
            // Disable first if enabled
            if (module.isEnabled()) {
                this.sendMessage(context, chalk.gray('Disabling module...'));
                await Promise.resolve(module.onDisable());
            }
            
            // Unload the module
            const unloadModule = (moduleManager as {
                unloadModule?: (moduleName: string) => Promise<boolean> | boolean;
            }).unloadModule;
            
            if (!unloadModule) {
                this.sendMessage(context, chalk.red('Module unloading is not supported by the module manager.'));
                return true;
            }
            
            const result = await Promise.resolve(unloadModule.call(moduleManager, actualName));
            
            if (result) {
                this.sendMessage(context, chalk.green(`✔ Successfully unloaded module: ${actualName}`));
            } else {
                this.sendMessage(context, chalk.red(`✖ Failed to unload module: ${actualName}`));
                this.sendMessage(context, chalk.gray('Check logs for details.'));
            }
            
        } catch (e) {
            this.sendMessage(context, chalk.red(`✖ Error unloading module: ${e instanceof Error ? e.message : String(e)}`));
        }
        
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const modules = getAllModules(context.client);
        const prefix = context.args[0] || '';
        
        return Object.freeze(
            modules
                .map(m => m.name)
                .filter(name => name.toLowerCase().startsWith(prefix.toLowerCase()))
                .sort()
        );
    }
}
