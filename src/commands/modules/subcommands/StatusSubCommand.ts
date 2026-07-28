/**
 * Show framework general status
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatKeyValue, formatUptime } from "../utils/formatting";
import { getAllModules } from "../utils/moduleUtils";
import { XadyScheduler } from "../../../classes/XadyScheduler";
import chalk from "chalk";

export class StatusSubCommand extends SubCommand {
    readonly name = 'status';
    readonly aliases = Object.freeze(['stat', 's']) as readonly string[];
    readonly description = 'Show framework general status';
    readonly usage = '/modules status';
    readonly permission = 'xady.modules.status';
    readonly examples = Object.freeze([
        '/modules status',
        '/modules stat'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const modules = getAllModules(context.client);
        const enabled = modules.filter(m => m.state === 'ENABLED').length;
        const disabled = modules.filter(m => m.state === 'DISABLED').length;
        const failed = modules.filter(m => m.state === 'FAILED').length;
        
        // Count commands
        const commandManager = context.client.getCommandManager();
        const allCommands = commandManager.getCommands();
        let totalCommands = 0;
        for (const commands of allCommands.values()) {
            totalCommands += commands.length;
        }
        
        // Count events
        const eventManager = context.client.getEventManager() as {
            eventMetrics?: Map<string, { count: number }>;
        };
        const eventMetrics = eventManager.eventMetrics || new Map();
        let totalEvents = 0;
        for (const metrics of eventMetrics.values()) {
            totalEvents += metrics.count;
        }
        
        // Count scheduler tasks
        const scheduler = XadyScheduler.getInstance();
        let totalTasks = 0;
        for (const module of modules) {
            totalTasks += scheduler.getActiveTaskCount(module.name);
        }
        
        // Memory usage
        const memUsage = process.memoryUsage();
        const heapUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
        
        // Uptime
        const uptimeMs = process.uptime() * 1000;
        
        const output: string[] = [];
        output.push(formatHeader('Framework Status'));
        output.push('');
        output.push(chalk.yellowBright.bold('Modules'));
        output.push(formatKeyValue('Total', modules.length, 1));
        output.push(formatKeyValue('Enabled', `${chalk.green(enabled)} (${((enabled/modules.length)*100).toFixed(1)}%)`, 1));
        output.push(formatKeyValue('Disabled', `${chalk.red(disabled)}`, 1));
        if (failed > 0) {
            output.push(formatKeyValue('Failed', `${chalk.yellow(failed)}`, 1));
        }
        
        output.push('');
        output.push(chalk.yellowBright.bold('Resources'));
        output.push(formatKeyValue('Commands', totalCommands, 1));
        output.push(formatKeyValue('Events Processed', totalEvents, 1));
        output.push(formatKeyValue('Active Tasks', totalTasks, 1));
        
        output.push('');
        output.push(chalk.yellowBright.bold('System'));
        output.push(formatKeyValue('Memory Usage', `${heapUsedMB} MB / ${heapTotalMB} MB`, 1));
        output.push(formatKeyValue('Uptime', formatUptime(uptimeMs), 1));
        output.push(formatKeyValue('Node Version', process.version, 1));
        
        this.sendMessages(context, output);
        return true;
    }
}
