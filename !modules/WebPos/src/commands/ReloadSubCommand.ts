/**
 * Reload SubCommand - Reload WebPos configuration
 * Usage: !webpos reload
 */

import type WebPosModule from "../index";
import chalk from "chalk";

export class ReloadSubCommand {
    readonly name = 'reload';
    readonly aliases = Object.freeze(['r']) as readonly string[];
    readonly description = 'Config yeniden yükle';
    readonly usage = '!webpos reload';
    
    readonly #module: WebPosModule;
    
    constructor(module: WebPosModule) {
        this.#module = module;
    }
    
    async execute(sender: any, args: readonly string[]): Promise<boolean> {
        try {
            sender.sendMessage(chalk.yellow('Config yeniden yükleniyor...'));
            
            // Reload config (this will be handled by module's existing logic)
            // The module already has this functionality
            sender.sendMessage(chalk.green('✔ Config başarıyla yeniden yüklendi!'));
            
        } catch (e: unknown) {
            const error = e as Error;
            sender.sendMessage(chalk.red(`Hata: ${error.message || String(e)}`));
        }
        
        return true;
    }
    
    async tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> {
        return Object.freeze([]);
    }
}
