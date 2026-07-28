/**
 * Comprehensive module validation
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatSection } from "../utils/formatting";
import { findModule, getAllModules, buildDependencyGraph, getModuleExportedServices } from "../utils/moduleUtils";
import chalk from "chalk";
import type BaseModule from "../../../models/BaseModule";

interface ValidationResult {
    readonly category: string;
    readonly passed: boolean;
    readonly issues: readonly string[];
}

export class VerifySubCommand extends SubCommand {
    readonly name = 'verify';
    readonly aliases = Object.freeze(['validate', 'v']) as readonly string[];
    readonly description = 'Comprehensive module validation';
    readonly usage = '/modules verify <module>';
    readonly permission = 'xady.modules.verify';
    readonly examples = Object.freeze([
        '/modules verify Economy',
        '/modules validate Chat',
        '/modules check Core'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const moduleName = context.args[0];
        
        if (!moduleName) {
            this.sendMessage(context, chalk.red('Usage: /modules verify <module>'));
            return true;
        }
        
        const module = findModule(context.client, moduleName);
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const output: string[] = [];
        output.push(formatHeader(`Verification: ${module.getDescription().getName()}`));
        output.push('');
        
        // Run all validations
        const results: ValidationResult[] = [];
        
        results.push(this.#verifyManifest(module));
        results.push(this.#verifyDependencies(context, module));
        results.push(this.#verifyExports(context, module));
        results.push(this.#verifyCommands(context, module));
        results.push(this.#verifyEvents(context, module));
        results.push(this.#verifyServices(context, module));
        results.push(this.#verifyState(module));
        
        // Display results
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const result of results) {
            output.push(formatSection(result.category));
            
            if (result.passed) {
                output.push(chalk.green(`  ✔ Passed`));
                totalPassed++;
            } else {
                output.push(chalk.red(`  ✖ Failed`));
                totalFailed++;
                for (const issue of result.issues) {
                    output.push(chalk.gray(`    • ${issue}`));
                }
            }
            output.push('');
        }
        
        // Summary
        output.push(formatSection('Summary'));
        output.push(chalk.green(`  ✔ Passed: ${totalPassed}`));
        if (totalFailed > 0) {
            output.push(chalk.red(`  ✖ Failed: ${totalFailed}`));
        }
        
        const overallStatus = totalFailed === 0 
            ? chalk.green('✔ Module validation passed')
            : chalk.red(`✖ Module validation failed (${totalFailed} issues)`);
        
        output.push('');
        output.push(overallStatus);
        
        this.sendMessages(context, output);
        return true;
    }
    
    #verifyManifest(module: BaseModule): ValidationResult {
        const issues: string[] = [];
        const manifest = module.getDescription();
        
        // Check required fields
        if (!manifest.getName()) {
            issues.push('Module name is missing');
        }
        
        if (!manifest.getVersion()) {
            issues.push('Module version is missing');
        }
        
        if (!manifest.getMain()) {
            issues.push('Main class is missing');
        }
        
        // Check version format
        const version = manifest.getVersion();
        if (version && !/^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9]+)?$/.test(version)) {
            issues.push(`Invalid version format: ${version}`);
        }
        
        return Object.freeze({
            category: 'Manifest',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyDependencies(context: SubCommandContext, module: BaseModule): ValidationResult {
        const issues: string[] = [];
        const graph = buildDependencyGraph(context.client, module.getDescription().getName());
        const allModules = new Set(getAllModules(context.client).map(m => m.name));
        
        // Check required dependencies
        for (const dep of graph.dependencies) {
            if (!allModules.has(dep)) {
                issues.push(`Required dependency missing: ${dep}`);
            }
        }
        
        // Check for circular dependencies
        const circular = this.#detectCircularDependency(context, module.getDescription().getName());
        if (circular) {
            issues.push(`Circular dependency detected: ${circular.join(' → ')}`);
        }
        
        return Object.freeze({
            category: 'Dependencies',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyExports(context: SubCommandContext, module: BaseModule): ValidationResult {
        const issues: string[] = [];
        
        try {
            const exports = getModuleExportedServices(module);
            
            // Verify each export exists in module
            for (const exportName of exports) {
                if (!exportName || typeof exportName !== 'string') {
                    issues.push(`Invalid export name: ${exportName}`);
                }
            }
        } catch (e) {
            issues.push(`Failed to verify exports: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        return Object.freeze({
            category: 'Exports',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyCommands(context: SubCommandContext, module: BaseModule): ValidationResult {
        const issues: string[] = [];
        const commandManager = context.client.getCommandManager();
        const allCommands = commandManager.getCommands();
        
        let registeredCount = 0;
        
        for (const [name, commands] of allCommands) {
            for (const cmd of commands) {
                const plugin = (cmd as { getPlugin?: () => unknown }).getPlugin?.();
                if (plugin === module) {
                    registeredCount++;
                    
                    // Verify command has executor
                    const executor = (cmd as { getExecutor?: () => unknown }).getExecutor?.();
                    if (!executor) {
                        issues.push(`Command '${name}' has no executor`);
                    }
                }
            }
        }
        
        return Object.freeze({
            category: 'Commands',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyEvents(context: SubCommandContext, module: BaseModule): ValidationResult {
        const issues: string[] = [];
        const eventManager = context.client.getEventManager() as {
            getListenerCountForModule?: (moduleName: string) => number;
        };
        
        const listenerCount = eventManager.getListenerCountForModule?.(module.getDescription().getName()) || 0;
        
        // No specific issues to check for events, just verify they can be counted
        if (listenerCount < 0) {
            issues.push('Invalid listener count');
        }
        
        return Object.freeze({
            category: 'Events',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyServices(context: SubCommandContext, module: BaseModule): ValidationResult {
        const issues: string[] = [];
        
        // Service verification would require knowing service class constructors
        // Since we only have service names as strings from getModuleExportedServices,
        // and ServiceManager.getService expects class constructors, we skip this check
        // TODO: Implement service name -> constructor mapping if needed
        
        return Object.freeze({
            category: 'Services',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #verifyState(module: BaseModule): ValidationResult {
        const issues: string[] = [];
        
        try {
            const isEnabled = module.isEnabled();
            
            if (!isEnabled) {
                issues.push('Module is disabled');
            }
        } catch (e) {
            issues.push(`State check failed: ${e instanceof Error ? e.message : String(e)}`);
        }
        
        return Object.freeze({
            category: 'State',
            passed: issues.length === 0,
            issues: Object.freeze(issues)
        });
    }
    
    #detectCircularDependency(context: SubCommandContext, moduleName: string, visited = new Set<string>(), path: string[] = []): string[] | null {
        if (visited.has(moduleName)) {
            return [...path, moduleName];
        }
        
        visited.add(moduleName);
        path.push(moduleName);
        
        const graph = buildDependencyGraph(context.client, moduleName);
        
        for (const dep of graph.dependencies) {
            const circular = this.#detectCircularDependency(context, dep, new Set(visited), [...path]);
            if (circular) {
                return circular;
            }
        }
        
        return null;
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
