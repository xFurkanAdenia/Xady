/**
 * Show help for all subcommands
 */

import { SubCommand } from "./SubCommand";
import type { SubCommandContext } from "../types";
import { formatHeader, formatSection, wrapText } from "../utils/formatting";
import type { SubCommandRegistry } from "../SubCommandRegistry";
import chalk from "chalk";

export class HelpSubCommand extends SubCommand {
    readonly name = 'help';
    readonly aliases = Object.freeze(['h', '?']) as readonly string[];
    readonly description = 'Show help for modules command';
    readonly usage = '/modules help [subcommand]';
    readonly permission = 'xady.modules.help';
    readonly examples = Object.freeze([
        '/modules help',
        '/modules help reload',
        '/modules ?'
    ]) as readonly string[];
    
    readonly #registry: SubCommandRegistry;
    
    constructor(registry: SubCommandRegistry) {
        super();
        this.#registry = registry;
    }
    
    async execute(context: SubCommandContext): Promise<boolean> {
        const subcommandName = context.args[0];
        
        // Show help for specific subcommand
        if (subcommandName) {
            return await this.#showSubCommandHelp(context, subcommandName);
        }
        
        // Show general help
        return await this.#showGeneralHelp(context);
    }
    
    async #showGeneralHelp(context: SubCommandContext): Promise<boolean> {
        const subcommands = this.#registry.getAll();
        
        const output: string[] = [];
        output.push(formatHeader('Modules Command Help'));
        output.push('');
        output.push(chalk.gray('Professional module management console'));
        output.push('');
        output.push(formatSection('Available Subcommands'));
        output.push('');
        
        // Group by category (for now, just list all)
        const sorted = [...subcommands].sort((a, b) => a.name.localeCompare(b.name));
        
        for (const subcmd of sorted) {
            const aliases = subcmd.aliases.length > 0 ? chalk.gray(` (${subcmd.aliases.join(', ')})`) : '';
            output.push(`  ${chalk.greenBright(subcmd.name)}${aliases}`);
            output.push(chalk.gray(`    ${subcmd.description}`));
        }
        
        output.push('');
        output.push(chalk.yellowBright('Usage:') + chalk.gray(' /modules <subcommand> [args...]'));
        output.push(chalk.yellowBright('Example:') + chalk.gray(' /modules list'));
        output.push(chalk.gray('Type /modules help <subcommand> for detailed help'));
        
        this.sendMessages(context, output);
        return true;
    }
    
    async #showSubCommandHelp(context: SubCommandContext, subcommandName: string): Promise<boolean> {
        const subcmd = this.#registry.get(subcommandName);
        
        if (!subcmd) {
            this.sendMessage(context, chalk.red(`Unknown subcommand: ${subcommandName}`));
            this.sendMessage(context, chalk.gray('Type /modules help for available commands'));
            return true;
        }
        
        const output: string[] = [];
        output.push(formatHeader(`Help: ${subcmd.name}`));
        output.push('');
        
        if (subcmd.aliases.length > 0) {
            output.push(chalk.yellowBright('Aliases: ') + chalk.gray(subcmd.aliases.join(', ')));
        }
        
        output.push(chalk.yellowBright('Description:'));
        const wrapped = wrapText(subcmd.description, 60);
        for (const line of wrapped) {
            output.push(chalk.gray(`  ${line}`));
        }
        
        output.push('');
        output.push(chalk.yellowBright('Usage: ') + chalk.white(subcmd.usage));
        
        if (subcmd.permission) {
            output.push(chalk.yellowBright('Permission: ') + chalk.gray(subcmd.permission));
        }
        
        if (subcmd.examples.length > 0) {
            output.push('');
            output.push(chalk.yellowBright('Examples:'));
            for (const example of subcmd.examples) {
                output.push(chalk.gray(`  ${example}`));
            }
        }
        
        this.sendMessages(context, output);
        return true;
    }
    
    async tabComplete(context: SubCommandContext): Promise<readonly string[]> {
        if (context.args.length !== 1) return Object.freeze([]);
        
        const prefix = context.args[0] || '';
        const names = this.#registry.getAllNames();
        
        return Object.freeze(
            names.filter(name => name.toLowerCase().startsWith(prefix.toLowerCase())).sort()
        );
    }
}
