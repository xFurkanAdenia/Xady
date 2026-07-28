/**
 * Base interface for all subcommands
 */

import type { SubCommand as ISubCommand, SubCommandContext } from "../types";

export abstract class SubCommand implements ISubCommand {
    abstract readonly name: string;
    abstract readonly aliases: readonly string[];
    abstract readonly description: string;
    abstract readonly usage: string;
    abstract readonly permission: string;
    abstract readonly examples: readonly string[];
    
    abstract execute(context: SubCommandContext): Promise<boolean>;
    
    async tabComplete(_context: SubCommandContext): Promise<readonly string[]> {
        return Object.freeze([]);
    }
    
    protected sendMessage(context: SubCommandContext, message: string): void {
        context.sender.sendMessage(message);
    }
    
    protected sendMessages(context: SubCommandContext, messages: readonly string[]): void {
        for (const message of messages) {
            context.sender.sendMessage(message);
        }
    }
    
    protected hasPermission(context: SubCommandContext): boolean {
        return context.sender.hasPermission(this.permission);
    }
    
    protected checkPermission(context: SubCommandContext): boolean {
        if (!this.hasPermission(context)) {
            this.sendMessage(context, `§cYou don't have permission to use this command.`);
            return false;
        }
        return true;
    }
}
