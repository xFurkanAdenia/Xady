/**
 * Health diagnostics for modules
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext, HealthReport, HealthIssue } from "../types";
import { formatHeader, formatKeyValue, formatSection } from "../utils/formatting";
import { getAllModules, findModule, getModuleState } from "../utils/moduleUtils";
import { XadyScheduler } from "../../../classes/XadyScheduler";
import chalk from "chalk";

export class HealthSubCommand extends SubCommand {
    readonly name = 'health';
    readonly aliases = Object.freeze(['check', 'diag']) as readonly string[];
    readonly description = 'Show health diagnostics for modules';
    readonly usage = '/modules health [module]';
    readonly permission = 'xady.modules.health';
    readonly examples = Object.freeze([
        '/modules health',
        '/modules health Melonya',
        '/modules check Core'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const targetModule = context.args[0];
        
        if (targetModule) {
            return await this.#showModuleHealth(context, targetModule);
        }
        
        return await this.#showAllHealth(context);
    }
    
    async #showModuleHealth(context: SubCommandContext, moduleName: string): Promise<boolean> {
        const module = findModule(context.client, moduleName);
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const report = this.#generateHealthReport(context, module);
        
        const output: string[] = [];
        output.push(formatHeader(`Health Report: ${report.moduleName}`));
        output.push('');
        
        // State
        const stateIcon = this.#getStateIcon(report.state);
        output.push(formatKeyValue('State', `${stateIcon} ${report.state}`));
        
        // Metrics
        output.push('');
        output.push(formatSection('Metrics'));
        output.push(formatKeyValue('CPU Time (Events)', formatDurationMs(report.cpuTimeMs), 1));
        output.push(formatKeyValue('Active Scheduler Tasks', report.activeSchedulers, 1));
        output.push(formatKeyValue('Chat Patterns', report.chatPatterns, 1));
        output.push(formatKeyValue('Registered Events', report.registeredEvents, 1));
        output.push(formatKeyValue('Registered Commands', report.registeredCommands, 1));
        output.push(formatKeyValue('Memory Usage', `${report.memoryUsageMB.toFixed(2)} MB`, 1));
        
        // Issues
        if (report.issues.length > 0) {
            output.push('');
            output.push(formatSection('Issues Detected'));
            for (const issue of report.issues) {
                const icon = this.#getIssueIcon(issue.severity);
                const color = this.#getIssueColor(issue.severity);
                output.push(`  ${icon} ${color(issue.type)}: ${chalk.gray(issue.message)}`);
            }
        } else {
            output.push('');
            output.push(chalk.green('✔ No issues detected'));
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    async #showAllHealth(context: SubCommandContext): Promise<boolean> {
        const modules = getAllModules(context.client);
        const reports = modules.map(m => this.#generateHealthReport(context, m.instance));
        
        const output: string[] = [];
        output.push(formatHeader('Framework Health Report'));
        output.push('');
        
        let totalIssues = 0;
        let criticalIssues = 0;
        let warningIssues = 0;
        
        for (const report of reports) {
            totalIssues += report.issues.length;
            criticalIssues += report.issues.filter(i => i.severity === 'CRITICAL').length;
            warningIssues += report.issues.filter(i => i.severity === 'WARNING').length;
        }
        
        // Summary
        output.push(formatKeyValue('Total Modules', modules.length));
        output.push(formatKeyValue('Total Issues', totalIssues));
        output.push(formatKeyValue('Critical', criticalIssues));
        output.push(formatKeyValue('Warnings', warningIssues));
        output.push('');
        
        // Modules with issues
        const problematicModules = reports.filter(r => r.issues.length > 0);
        
        if (problematicModules.length > 0) {
            output.push(formatSection('Modules with Issues'));
            output.push('');
            
            for (const report of problematicModules) {
                const critical = report.issues.filter(i => i.severity === 'CRITICAL').length;
                const warnings = report.issues.filter(i => i.severity === 'WARNING').length;
                
                const status = critical > 0 
                    ? chalk.red(`${critical} critical, ${warnings} warnings`)
                    : chalk.yellow(`${warnings} warnings`);
                
                output.push(`  ${this.#getStateIcon(report.state)} ${chalk.white(report.moduleName)}: ${status}`);
            }
        } else {
            output.push(chalk.green('✔ All modules are healthy'));
        }
        
        output.push('');
        output.push(chalk.gray('Use /modules health <module> for detailed diagnostics'));
        
        this.sendMessages(context, output);
        return true;
    }
    
    #generateHealthReport(context: SubCommandContext, module: BaseModule): HealthReport {
        const moduleName = module.getDescription().getName();
        const state = getModuleState(module);
        const issues: HealthIssue[] = [];
        
        // Get metrics
        const eventManager = context.client.getEventManager() as {
            eventMetrics?: Map<string, { count: number; totalDurationMs: number }>;
        };
        const metrics = eventManager.eventMetrics?.get(moduleName);
        const cpuTimeMs = metrics?.totalDurationMs || 0;
        
        const scheduler = XadyScheduler.getInstance();
        const activeSchedulers = scheduler.getActiveTaskCount(moduleName);
        const chatPatterns = module.getChatPatterns().size;
        
        // Count registered events
        const registeredEvents = (context.client.getEventManager() as {
            getListenerCountForModule?: (moduleName: string) => number;
        }).getListenerCountForModule?.(moduleName) || 0;
        
        // Count registered commands
        let registeredCommands = 0;
        const commandManager = context.client.getCommandManager();
        const allCommands = commandManager.getCommands();
        for (const commands of allCommands.values()) {
            registeredCommands += commands.filter(cmd => {
                const plugin = (cmd as { getPlugin?: () => unknown }).getPlugin?.();
                return plugin === module;
            }).length;
        }
        
        // Memory usage (approximation)
        const memoryUsageMB = 0; // TODO: Implement memory tracking
        
        // Detect issues
        
        // 1. High CPU time
        if (cpuTimeMs > 10000) {
            issues.push({
                severity: 'WARNING',
                type: 'High CPU Usage',
                message: `Total event CPU time is ${formatDurationMs(cpuTimeMs)}`
            });
        }
        
        if (cpuTimeMs > 30000) {
            issues.push({
                severity: 'CRITICAL',
                type: 'Very High CPU Usage',
                message: `Total event CPU time exceeds 30 seconds`
            });
        }
        
        // 2. State issues
        if (state === 'FAILED') {
            issues.push({
                severity: 'CRITICAL',
                type: 'Module Failed',
                message: 'Module is in FAILED state'
            });
        }
        
        // 3. Dead scheduler tasks
        if (activeSchedulers > 100) {
            issues.push({
                severity: 'WARNING',
                type: 'Many Scheduler Tasks',
                message: `${activeSchedulers} active tasks may cause performance issues`
            });
        }
        
        // 4. Orphaned listeners (module disabled but has listeners)
        if (state === 'DISABLED' && registeredEvents > 0) {
            issues.push({
                severity: 'WARNING',
                type: 'Orphaned Listeners',
                message: `${registeredEvents} event listeners still registered while disabled`
            });
        }
        
        // 5. No resources registered (might be broken)
        if (state === 'ENABLED' && registeredEvents === 0 && registeredCommands === 0 && chatPatterns === 0) {
            issues.push({
                severity: 'INFO',
                type: 'No Resources',
                message: 'Module has no registered events, commands, or chat patterns'
            });
        }
        
        return Object.freeze({
            moduleName,
            state,
            cpuTimeMs,
            activeSchedulers,
            chatPatterns,
            registeredEvents,
            registeredCommands,
            memoryUsageMB,
            issues: Object.freeze(issues)
        });
    }
    
    #getStateIcon(state: string): string {
        switch (state) {
            case 'ENABLED': return chalk.green('✔');
            case 'DISABLED': return chalk.red('✖');
            case 'FAILED': return chalk.red('✖');
            case 'LOADING': return chalk.yellow('⌛');
            case 'RELOADING': return chalk.yellow('⌛');
            default: return chalk.gray('?');
        }
    }
    
    #getIssueIcon(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return chalk.red('✖');
            case 'WARNING': return chalk.yellow('⚠');
            case 'INFO': return chalk.blue('ℹ');
            default: return chalk.gray('•');
        }
    }
    
    #getIssueColor(severity: string): (text: string) => string {
        switch (severity) {
            case 'CRITICAL': return chalk.red;
            case 'WARNING': return chalk.yellow;
            case 'INFO': return chalk.blue;
            default: return chalk.gray;
        }
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

function formatDurationMs(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

import type BaseModule from "../../../models/BaseModule";
