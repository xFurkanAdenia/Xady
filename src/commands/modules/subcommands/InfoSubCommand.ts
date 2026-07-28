/**
 * Show detailed information about a module
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatKeyValue, formatList } from "../utils/formatting";
import { findModule, getModuleMetrics, filterModulesByPrefix, sortModules } from "../utils/moduleUtils";
import { XadyScheduler } from "../../../classes/XadyScheduler";
import chalk from "chalk";

export class InfoSubCommand extends SubCommand {
    readonly name = 'info';
    readonly aliases = Object.freeze(['i', 'show']) as readonly string[];
    readonly description = 'Show detailed information about a specific module';
    readonly usage = '/modules info <module>';
    readonly permission = 'xady.modules.info';
    readonly examples = Object.freeze([
        '/modules info Core',
        '/modules i Economy'
    ]) as readonly string[];
    
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
        
        const manifest = module.getDescription();
        const metrics = getModuleMetrics(context.client, module.getName());
        const scheduler = XadyScheduler.getInstance();
        
        const output: string[] = [];
        output.push(formatHeader(module.getName()));
        output.push('');
        
        // Basic Info
        output.push(formatKeyValue('Version', manifest.getVersion()));
        output.push(formatKeyValue('Description', manifest.getDescription()));
        
        const author = manifest.getAuthor();
        if (author) {
            output.push(formatKeyValue('Author(s)', author));
        }
        
        const website = manifest.getWebsite();
        if (website) {
            output.push(formatKeyValue('Website', website));
        }
        
        output.push(formatKeyValue('Main Class', manifest.getMain()));
        output.push(formatKeyValue('State', module.isEnabled() ? chalk.green('ENABLED') : chalk.red('DISABLED')));
        
        const apiVersion = manifest.getApiVersion();
        if (apiVersion) {
            output.push(formatKeyValue('API Version', apiVersion));
        }
        
        // Dependencies
        const deps = manifest.getDependencies();
        if (deps && deps.length > 0) {
            output.push('');
            output.push(chalk.yellowBright('Dependencies:'));
            output.push(...formatList(deps, '•', 1));
        }
        
        const softDeps = manifest.getSoftDependencies();
        if (softDeps && softDeps.length > 0) {
            output.push('');
            output.push(chalk.yellowBright('Soft Dependencies:'));
            output.push(...formatList(softDeps, '•', 1));
        }
        
        // Registered Resources
        output.push('');
        output.push(chalk.yellowBright('Registered Resources:'));
        output.push(formatKeyValue('Chat Patterns', module.getChatPatterns().size, 1));
        output.push(formatKeyValue('Active Tasks', scheduler.getActiveTaskCount(module.getName()), 1));
        output.push(formatKeyValue('Events Processed', metrics.count, 1));
        
        // Performance Metrics
        if (metrics.count > 0) {
            output.push('');
            output.push(chalk.yellowBright('Performance:'));
            output.push(formatKeyValue('Total CPU Time', `${metrics.totalDurationMs.toFixed(2)} ms`, 1));
            output.push(formatKeyValue('Avg Event Time', `${metrics.avgDurationMs.toFixed(2)} ms`, 1));
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const modules = context.client.getModuleManager().getModules();
        const names = Array.from(modules.keys());
        const prefix = context.args[0] || '';
        
        return Object.freeze(sortModules(filterModulesByPrefix(names, prefix)));
    }
}
