/**
 * Load a new module from file
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import chalk from "chalk";
import { getAllModules } from "../utils/moduleUtils";

export class LoadSubCommand extends SubCommand {
    readonly name = 'load';
    readonly aliases = Object.freeze(['l']) as readonly string[];
    readonly description = 'Load a new module from file';
    readonly usage = '/modules load <file>';
    readonly permission = 'xady.modules.load';
    readonly examples = Object.freeze([
        '/modules load NewModule.xext',
        '/modules l MyPlugin.xext'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const fileName = context.args[0];
        
        if (!fileName) {
            this.sendMessage(context, chalk.red('Usage: /modules load <file>'));
            return true;
        }
        
        this.sendMessage(context, chalk.yellow(`Loading module: ${fileName}...`));
        
        try {
            const moduleManager = context.client.getModuleManager();
            
            // Check if module is already loaded
            const existingModules = getAllModules(context.client);
            const baseName = fileName.replace(/\.xext$/, '');
            
            const alreadyLoaded = existingModules.find(m => 
                m.name.toLowerCase() === baseName.toLowerCase()
            );
            
            if (alreadyLoaded) {
                this.sendMessage(context, chalk.red(`Module '${baseName}' is already loaded.`));
                this.sendMessage(context, chalk.gray('Use /modules reload to reload it.'));
                return true;
            }
            
            // Load the module
            const loadModule = (moduleManager as {
                loadModule?: (fileName: string) => Promise<boolean> | boolean;
            }).loadModule;
            
            if (!loadModule) {
                this.sendMessage(context, chalk.red('Module loading is not supported by the module manager.'));
                return true;
            }
            
            const result = await Promise.resolve(loadModule.call(moduleManager, fileName));
            
            if (result) {
                this.sendMessage(context, chalk.green(`✔ Successfully loaded module: ${baseName}`));
            } else {
                this.sendMessage(context, chalk.red(`✖ Failed to load module: ${fileName}`));
                this.sendMessage(context, chalk.gray('Check logs for details.'));
            }
            
        } catch (e) {
            this.sendMessage(context, chalk.red(`✖ Error loading module: ${e instanceof Error ? e.message : String(e)}`));
        }
        
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        // Tab complete with .xext files from !modules directory
        // This would require filesystem access
        // For now, return empty array
        return Object.freeze([]);
    }
}
