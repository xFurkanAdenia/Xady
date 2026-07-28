/**
 * Search for modules by name, description, or author
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatModuleState } from "../utils/stateIcons";
import { formatHeader } from "../utils/formatting";
import { getAllModules, getModuleState } from "../utils/moduleUtils";
import chalk from "chalk";

export class SearchSubCommand extends SubCommand {
    readonly name = 'search';
    readonly aliases = Object.freeze(['find', 'f']) as readonly string[];
    readonly description = 'Search for modules by name, description, or author';
    readonly usage = '/modules search <query>';
    readonly permission = 'xady.modules.search';
    readonly examples = Object.freeze([
        '/modules search economy',
        '/modules find chat',
        '/modules f core'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const query = context.args.join(' ').toLowerCase();
        if (!query) {
            this.sendMessage(context, `§cUsage: ${this.usage}`);
            return true;
        }
        
        const modules = getAllModules(context.client);
        const results = modules.filter(module => {
            const manifest = module.instance.getDescription();
            const name = module.name.toLowerCase();
            const description = manifest.getDescription().toLowerCase();
            const author = manifest.getAuthor();
            const authorStr = Array.isArray(author) 
                ? author.join(' ').toLowerCase() 
                : (typeof author === 'string' ? author.toLowerCase() : '');
            
            return name.includes(query) || 
                   description.includes(query) || 
                   authorStr.includes(query);
        });
        
        if (results.length === 0) {
            this.sendMessage(context, chalk.yellow(`No modules found matching '${query}'`));
            return true;
        }
        
        const output: string[] = [];
        output.push(formatHeader(`Search Results (${results.length})`));
        output.push(chalk.gray(`Query: "${query}"`));
        output.push('');
        
        for (const module of results) {
            const manifest = module.instance.getDescription();
            output.push(formatModuleState(module.name, module.version, module.state));
            output.push(chalk.gray(`  ${manifest.getDescription()}`));
            
            const author = manifest.getAuthor();
            if (author) {
                const authorStr = Array.isArray(author) ? author.join(', ') : author;
                output.push(chalk.gray(`  Author: ${authorStr}`));
            }
            output.push('');
        }
        
        this.sendMessages(context, output);
        return true;
    }
}
