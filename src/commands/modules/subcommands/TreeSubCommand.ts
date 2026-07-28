/**
 * Show dependency tree in ASCII format
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader } from "../utils/formatting";
import { getAllModules, buildDependencyGraph } from "../utils/moduleUtils";
import chalk from "chalk";

export class TreeSubCommand extends SubCommand {
    readonly name = 'tree';
    readonly aliases = Object.freeze(['t', 'deps-tree']) as readonly string[];
    readonly description = 'Show module dependency tree';
    readonly usage = '/modules tree [module]';
    readonly permission = 'xady.modules.tree';
    readonly examples = Object.freeze([
        '/modules tree',
        '/modules tree Core',
        '/modules t Database'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const targetModule = context.args[0];
        
        if (targetModule) {
            return await this.#showModuleTree(context, targetModule);
        }
        
        return await this.#showFullTree(context);
    }
    
    async #showModuleTree(context: SubCommandContext, moduleName: string): Promise<boolean> {
        const modules = getAllModules(context.client);
        const module = modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase());
        
        if (!module) {
            this.sendMessage(context, chalk.red(`Module '${moduleName}' not found.`));
            return true;
        }
        
        const output: string[] = [];
        output.push(formatHeader(`Dependency Tree: ${module.name}`));
        output.push('');
        
        const visited = new Set<string>();
        this.#buildTree(context, module.name, '', output, visited, true);
        
        this.sendMessages(context, output);
        return true;
    }
    
    async #showFullTree(context: SubCommandContext): Promise<boolean> {
        const modules = getAllModules(context.client);
        
        const output: string[] = [];
        output.push(formatHeader('Full Dependency Tree'));
        output.push('');
        
        // Find root modules (modules with no dependencies)
        const roots: string[] = [];
        const allModuleNames = new Set(modules.map(m => m.name));
        
        for (const module of modules) {
            const graph = buildDependencyGraph(context.client, module.name);
            const hasUnresolvedDeps = graph.dependencies.some(dep => !allModuleNames.has(dep));
            
            if (graph.dependencies.length === 0 || hasUnresolvedDeps) {
                roots.push(module.name);
            }
        }
        
        // If no roots found, just list all modules
        if (roots.length === 0) {
            for (const module of modules) {
                roots.push(module.name);
            }
        }
        
        const visited = new Set<string>();
        
        for (let i = 0; i < roots.length; i++) {
            const isLast = i === roots.length - 1;
            this.#buildTree(context, roots[i], '', output, visited, isLast);
        }
        
        if (output.length === 1) {
            output.push(chalk.gray('No modules with dependencies found'));
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    #buildTree(
        context: SubCommandContext,
        moduleName: string,
        prefix: string,
        output: string[],
        visited: Set<string>,
        isLast: boolean
    ): void {
        const graph = buildDependencyGraph(context.client, moduleName);
        const isCircular = visited.has(moduleName);
        
        // Print current module
        const connector = isLast ? '└── ' : '├── ';
        const moduleDisplay = isCircular 
            ? chalk.yellow(`${moduleName} (circular)`)
            : chalk.white(moduleName);
        
        output.push(`${prefix}${connector}${moduleDisplay}`);
        
        if (isCircular) {
            return; // Stop recursion for circular dependencies
        }
        
        visited.add(moduleName);
        
        const allDeps = [
            ...graph.dependencies,
            ...graph.softDependencies.map(d => `${d} (soft)`)
        ];
        
        if (allDeps.length === 0) {
            return;
        }
        
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        
        for (let i = 0; i < allDeps.length; i++) {
            const depName = allDeps[i];
            const isSoft = depName.includes('(soft)');
            const cleanName = isSoft ? depName.replace(' (soft)', '') : depName;
            const isLastDep = i === allDeps.length - 1;
            
            // Check if dependency exists
            const depExists = getAllModules(context.client).some(m => m.name === cleanName);
            
            if (!depExists) {
                const connector = isLastDep ? '└── ' : '├── ';
                const display = isSoft
                    ? chalk.gray(`${cleanName} (soft, missing)`)
                    : chalk.red(`${cleanName} (missing)`);
                output.push(`${newPrefix}${connector}${display}`);
            } else {
                this.#buildTree(context, cleanName, newPrefix, output, new Set(visited), isLastDep);
            }
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
