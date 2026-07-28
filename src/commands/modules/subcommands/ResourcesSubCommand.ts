/**
 * Show detailed resource usage for modules
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatSection, formatKeyValue } from "../utils/formatting";
import { findModule, getAllModules, getModuleExportedServices } from "../utils/moduleUtils";
import { XadyScheduler } from "../../../classes/XadyScheduler";
import chalk from "chalk";
import type BaseModule from "../../../models/BaseModule";

export class ResourcesSubCommand extends SubCommand {
    readonly name = 'resources';
    readonly aliases = Object.freeze(['res', 'usage']) as readonly string[];
    readonly description = 'Show detailed resource usage';
    readonly usage = '/modules resources <module>';
    readonly permission = 'xady.modules.resources';
    readonly examples = Object.freeze([
        '/modules resources Melonya',
        '/modules res Economy',
        '/modules usage Chat'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const moduleName = context.args[0];
        
        if (!moduleName) {
            this.sendMessage(context, chalk.red('Usage: /modules resources <module>'));
            return true;
        }
        
        const module = findModule(context.client, moduleName);
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const output: string[] = [];
        output.push(formatHeader(`Resource Usage: ${module.getDescription().getName()}`));
        output.push('');
        
        // Events
        output.push(formatSection('Events'));
        const eventCount = this.#countRegisteredEvents(context, module);
        output.push(formatKeyValue('Registered Listeners', eventCount, 1));
        
        const eventMetrics = this.#getEventMetrics(context, module);
        output.push(formatKeyValue('Events Processed', eventMetrics.count, 1));
        output.push(formatKeyValue('Total CPU Time', this.#formatDuration(eventMetrics.totalMs), 1));
        if (eventMetrics.count > 0) {
            output.push(formatKeyValue('Average Time', this.#formatDuration(eventMetrics.avgMs), 1));
        }
        
        output.push('');
        
        // Commands
        output.push(formatSection('Commands'));
        const commands = this.#getRegisteredCommands(context, module);
        output.push(formatKeyValue('Registered Commands', commands.length, 1));
        if (commands.length > 0) {
            for (const cmd of commands) {
                output.push(chalk.gray(`    • /${cmd}`));
            }
        }
        
        output.push('');
        
        // Services
        output.push(formatSection('Services'));
        const exportedServices = getModuleExportedServices(module);
        output.push(formatKeyValue('Exported Services', exportedServices.length, 1));
        if (exportedServices.length > 0) {
            for (const service of exportedServices) {
                output.push(chalk.cyan(`    • ${service}`));
            }
        }
        
        output.push('');
        
        // Scheduler
        output.push(formatSection('Scheduler'));
        const scheduler = XadyScheduler.getInstance();
        const activeTaskCount = scheduler.getActiveTaskCount(module.getDescription().getName());
        output.push(formatKeyValue('Active Tasks', activeTaskCount, 1));
        
        const taskBreakdown = this.#getTaskBreakdown(module);
        output.push(formatKeyValue('Intervals', taskBreakdown.intervals, 1));
        output.push(formatKeyValue('Timeouts', taskBreakdown.timeouts, 1));
        output.push(formatKeyValue('Workers', taskBreakdown.workers, 1));
        
        output.push('');
        
        // Chat Patterns
        output.push(formatSection('Chat Patterns'));
        const chatPatterns = module.getChatPatterns();
        output.push(formatKeyValue('Registered Patterns', chatPatterns.size, 1));
        if (chatPatterns.size > 0 && chatPatterns.size <= 10) {
            for (const pattern of chatPatterns.keys()) {
                const displayPattern = pattern.toString().length > 50 
                    ? pattern.toString().substring(0, 47) + '...'
                    : pattern.toString();
                output.push(chalk.gray(`    • ${displayPattern}`));
            }
        } else if (chatPatterns.size > 10) {
            output.push(chalk.gray(`    (${chatPatterns.size} patterns registered)`));
        }
        
        output.push('');
        
        // Memory (approximation)
        output.push(formatSection('Memory'));
        output.push(formatKeyValue('Estimated Usage', chalk.gray('N/A (not tracked)'), 1));
        
        this.sendMessages(context, output);
        return true;
    }
    
    #countRegisteredEvents(context: SubCommandContext, module: BaseModule): number {
        const eventManager = context.client.getEventManager() as {
            getListenerCountForModule?: (moduleName: string) => number;
        };
        
        return eventManager.getListenerCountForModule?.(module.getDescription().getName()) || 0;
    }
    
    #getEventMetrics(context: SubCommandContext, module: BaseModule): { count: number; totalMs: number; avgMs: number } {
        const eventManager = context.client.getEventManager() as {
            eventMetrics?: Map<string, { count: number; totalDurationMs: number }>;
        };
        
        const moduleName = module.getDescription().getName();
        const metrics = eventManager.eventMetrics?.get(moduleName);
        
        if (!metrics) {
            return { count: 0, totalMs: 0, avgMs: 0 };
        }
        
        return {
            count: metrics.count,
            totalMs: metrics.totalDurationMs,
            avgMs: metrics.count > 0 ? metrics.totalDurationMs / metrics.count : 0
        };
    }
    
    #getRegisteredCommands(context: SubCommandContext, module: BaseModule): readonly string[] {
        const commandManager = context.client.getCommandManager();
        const allCommands = commandManager.getCommands();
        const result: string[] = [];
        
        for (const [name, commands] of allCommands) {
            for (const cmd of commands) {
                const plugin = (cmd as { getPlugin?: () => unknown }).getPlugin?.();
                if (plugin === module) {
                    result.push(name);
                }
            }
        }
        
        return Object.freeze(result);
    }
    
    #getTaskBreakdown(module: BaseModule): { intervals: number; timeouts: number; workers: number } {
        const scheduler = XadyScheduler.getInstance();
        const moduleName = module.getDescription().getName();
        
        // Try to get task breakdown from scheduler
        const tasks = (scheduler as { getTasksByModule?: (name: string) => unknown[] }).getTasksByModule?.(moduleName) || [];
        
        let intervals = 0;
        let timeouts = 0;
        let workers = 0;
        
        for (const task of tasks) {
            const taskType = (task as { type?: string }).type;
            switch (taskType) {
                case 'interval':
                    intervals++;
                    break;
                case 'timeout':
                    timeouts++;
                    break;
                case 'worker':
                    workers++;
                    break;
            }
        }
        
        return { intervals, timeouts, workers };
    }
    
    #formatDuration(ms: number): string {
        if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
        if (ms < 1000) return `${ms.toFixed(2)} ms`;
        return `${(ms / 1000).toFixed(2)} s`;
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
