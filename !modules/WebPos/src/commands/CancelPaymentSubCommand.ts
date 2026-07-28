/**
 * CancelPayment SubCommand - Cancel an active payment
 * Usage: !webpos cancelPayment <payment-id>
 */

import type WebPosModule from "../index";
import { POS_PAYMENT_STATUS } from "../models/PosPayment";
import chalk from "chalk";

export class CancelPaymentSubCommand {
    readonly name = 'cancelPayment';
    readonly aliases = Object.freeze(['cancel', 'remove']) as readonly string[];
    readonly description = 'Ödemeyi iptal et';
    readonly usage = '!webpos cancelPayment <payment-id>';
    
    readonly #module: WebPosModule;
    
    constructor(module: WebPosModule) {
        this.#module = module;
    }
    
    async execute(sender: any, args: readonly string[]): Promise<boolean> {
        if (args.length < 1) {
            sender.sendMessage(chalk.red('Kullanım: ' + this.usage));
            sender.sendMessage(chalk.gray('Örnek: !webpos cancelPayment abc123-def456-...'));
            return true;
        }
        
        const paymentId = args[0];
        
        try {
            const posManager = this.#module.getPosManager();
            const payment = posManager.getPayment(paymentId);
            
            if (!payment) {
                sender.sendMessage(chalk.red(`Ödeme bulunamadı: ${paymentId}`));
                return true;
            }
            
            const status = payment.getStatus();
            if (status !== POS_PAYMENT_STATUS.PENDING) {
                sender.sendMessage(chalk.yellow(`Bu ödeme zaten iptal edilemez (Durum: ${status})`));
                return true;
            }
            
            const bot = this.#module.getClient().getBot();
            const cancelled = posManager.cancelPayment(paymentId, bot);
            
            if (cancelled) {
                sender.sendMessage(chalk.green(`✔ Ödeme iptal edildi!`));
                sender.sendMessage(chalk.white(`ID: ${paymentId}`));
                sender.sendMessage(chalk.white(`Kullanıcı: ${payment.getUsername()}`));
                sender.sendMessage(chalk.white(`Miktar: ${payment.getAmount().toFixed(2)}`));
            } else {
                sender.sendMessage(chalk.red(`Ödeme iptal edilemedi.`));
            }
            
        } catch (e: unknown) {
            const error = e as Error;
            sender.sendMessage(chalk.red(`Hata: ${error.message || String(e)}`));
        }
        
        return true;
    }
    
    async tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> {
        if (args.length === 1) {
            // Suggest active payment IDs
            const posManager = this.#module.getPosManager();
            const activePayments = posManager.getActivePayments();
            return Object.freeze(activePayments.map(p => p.getId()));
        }
        
        return Object.freeze([]);
    }
}
