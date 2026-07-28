/**
 * Show detailed dependency information
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatSection, formatList } from "../utils/formatting";
import { getAllModules, buildDependencyGraph, findModule, getModuleExportedServices } from "../utils/moduleUtils";
import chalk from "chalk";

interface BaseModuleType {
    getDescription: () => { getName: () => string };
}

type BaseModule = BaseModuleType;

export class DepsSubCommand extends SubCommand {
    readonly name = 'deps';
    readonly aliases = Object.freeze(['dependencies', 'depend']) as readonly string[];
    readonly description = 'Show detailed dependency information';
    readonly usage = '/modules deps <module>';
    readonly permission = 'xady.modules.deps';
    readonly examples = Object.freeze([
        '/modules deps Economy',
        '/modules dependencies Chat',
        '/modules depend Core'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const moduleName = context.args[0];
        
        if (!moduleName) {
            this.sendMessage(context, chalk.red('Usage: /modules deps <module>'));
            return true;
        }
        
        const module = findModule(context.client, moduleName);
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const graph = buildDependencyGraph(context.client, module.getDescription().getName());
        const allModuleNames = new Set(getAllModules(context.client).map(m => m.name));
        
        const output: string[] = [];
        output.push(formatHeader(`Dependencies: ${graph.moduleName}`));
        output.push('');
        
        // Required Dependencies
        output.push(formatSection('Required Dependencies'));
        if (graph.dependencies.length === 0) {
            output.push(chalk.gray('  None'));
        } else {
            const depLines: string[] = [];
            for (const dep of graph.dependencies) {
                const exists = allModuleNames.has(dep);
                const status = exists ? chalk.green('✔') : chalk.red('✖ missing');
                depLines.push(`${chalk.white(dep)} ${status}`);
            }
            output.push(...formatList(depLines, '•', 1));
        }
        
        output.push('');
        
        // Soft Dependencies
        output.push(formatSection('Soft Dependencies'));
        if (graph.softDependencies.length === 0) {
            output.push(chalk.gray('  None'));
        } else {
            const softDepLines: string[] = [];
            for (const dep of graph.softDependencies) {
                const exists = allModuleNames.has(dep);
                const status = exists ? chalk.green('✔ loaded') : chalk.gray('not loaded');
                softDepLines.push(`${chalk.white(dep)} ${status}`);
            }
            output.push(...formatList(softDepLines, '•', 1));
        }
        
        output.push('');
        
        // Reverse Dependencies (who depends on this module)
        output.push(formatSection('Reverse Dependencies'));
        if (graph.reverseDependencies.length === 0) {
            output.push(chalk.gray('  None (no modules depend on this)'));
        } else {
            const reverseLines = graph.reverseDependencies.map(dep => {
                const depModule = findModule(context.client, dep);
                const depGraph = depModule ? buildDependencyGraph(context.client, dep) : null;
                const isSoft = depGraph?.softDependencies.includes(graph.moduleName);
                const type = isSoft ? chalk.gray('(soft)') : chalk.white('(required)');
                return `${chalk.white(dep)} ${type}`;
            });
            output.push(...formatList(reverseLines, '•', 1));
        }
        
        output.push('');
        
        // Exported Services
        const services = getModuleExportedServices(module);
        output.push(formatSection('Exported Services'));
        if (services.length === 0) {
            output.push(chalk.gray('  None'));
        } else {
            const serviceLines = services.map((s: string) => chalk.cyan(s));
            output.push(...formatList(serviceLines, '•', 1));
        }
        
        output.push('');
        
        // Imported Services
        const importedServices = this.#getImportedServices(context, module);
        output.push(formatSection('Imported Services'));
        if (importedServices.length === 0) {
            output.push(chalk.gray('  None'));
        } else {
            const importLines = importedServices.map(({ service, provider }) => {
                const providerModule = findModule(context.client, provider);
                const status = providerModule ? chalk.green('✔') : chalk.red('✖');
                return `${chalk.cyan(service)} ${chalk.gray('from')} ${chalk.white(provider)} ${status}`;
            });
            output.push(...formatList(importLines, '•', 1));
        }
        
        // Dependency Status
        output.push('');
        output.push(formatSection('Status'));
        
        const missingRequired = graph.dependencies.filter(d => !allModuleNames.has(d));
        const satisfiedRequired = graph.dependencies.filter(d => allModuleNames.has(d));
        const loadedSoft = graph.softDependencies.filter(d => allModuleNames.has(d));
        
        if (missingRequired.length > 0) {
            output.push(chalk.red(`  ✖ ${missingRequired.length} required dependencies missing`));
            output.push(chalk.gray(`    Module cannot function properly`));
        } else if (graph.dependencies.length > 0) {
            output.push(chalk.green(`  ✔ All ${satisfiedRequired.length} required dependencies satisfied`));
        }
        
        if (loadedSoft.length > 0) {
            output.push(chalk.green(`  ✔ ${loadedSoft.length}/${graph.softDependencies.length} soft dependencies loaded`));
        }
        
        if (graph.reverseDependencies.length > 0) {
            output.push(chalk.blue(`  ℹ ${graph.reverseDependencies.length} modules depend on this`));
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    #getImportedServices(context: SubCommandContext, module: BaseModule): readonly { service: string; provider: string }[] {
        const serviceManager = context.client.getServiceManager();
        const result: { service: string; provider: string }[] = [];
        
        // This would require tracking service imports in the module
        // For now, return empty array as we don't have this information readily available
        // TODO: Implement service import tracking
        
        return Object.freeze(result);
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
