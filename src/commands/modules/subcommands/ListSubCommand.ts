/**
 * List all modules with their states
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatModuleState } from "../utils/stateIcons";
import { formatHeader, formatSection } from "../utils/formatting";
import { getAllModules } from "../utils/moduleUtils";
import chalk from "chalk";

export class ListSubCommand extends SubCommand {
    readonly name = 'list';
    readonly aliases = Object.freeze(['ls']) as readonly string[];
    readonly description = 'List all loaded modules with their states';
    readonly usage = '/modules list';
    readonly permission = 'xady.modules.list';
    readonly examples = Object.freeze([
        '/modules list',
        '/modules ls'
    ]) as readonly string[];
    
    async execute(context: SubCommandContext): Promise<boolean> {
        if (!this.checkPermission(context)) return true;
        
        const modules = getAllModules(context.client);
        
        if (modules.length === 0) {
            this.sendMessage(context, chalk.yellow('No modules loaded.'));
            return true;
        }
        
        const enabled = modules.filter(m => m.state === 'ENABLED').length;
        const disabled = modules.filter(m => m.state === 'DISABLED').length;
        const failed = modules.filter(m => m.state === 'FAILED').length;
        
        const output: string[] = [];
        output.push(formatHeader(`Modules (${modules.length})`));
        output.push('');
        output.push(formatSection(`Summary`));
        output.push(chalk.green(`  ✔ Enabled: ${enabled}`));
        output.push(chalk.red(`  ✖ Disabled: ${disabled}`));
        if (failed > 0) {
            output.push(chalk.yellow(`  ⚠ Failed: ${failed}`));
        }
        output.push('');
        output.push(formatSection(`Loaded Modules`));
        
        const sorted = [...modules].sort((a, b) => {
            if (a.state !== b.state) {
                const order = { ENABLED: 0, DISABLED: 1, FAILED: 2, LOADING: 3, RELOADING: 4, UNKNOWN: 5 };
                return order[a.state] - order[b.state];
            }
            return a.name.localeCompare(b.name);
        });
        
        for (const module of sorted) {
            output.push(`  ${formatModuleState(module.name, module.version, module.state)}`);
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    async tabComplete(_context: SubCommandContext): Promise<readonly string[]> {
        return Object.freeze([]);
    }
}
