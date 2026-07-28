/**
 * StartPayment SubCommand - Create new payment
 * Usage: !webpos startPayment <payer> <receiver|-> <amount>
 */

import type WebPosModule from "../index";
import chalk from "chalk";

export class StartPaymentSubCommand {
    readonly name = 'startPayment';
    readonly aliases = Object.freeze(['start', 'create']) as readonly string[];
    readonly description = 'Yeni ödeme oluştur';
    readonly usage = '!webpos startPayment <ödeme-yapacak> <alacak-kişi|-> <miktar>';
    
    readonly #module: WebPosModule;
    
    constructor(module: WebPosModule) {
        this.#module = module;
    }
    
    async execute(sender: any, args: readonly string[]): Promise<boolean> {
        if (args.length < 3) {
            sender.sendMessage(chalk.red('Kullanım: ' + this.usage));
            sender.sendMessage(chalk.gray('Örnek: !webpos startPayment Xady Melonya 100.50'));
            sender.sendMessage(chalk.gray('Örnek: !webpos startPayment Xady - 50.00'));
            return true;
        }
        
        const payer = args[0];
        const receiver = args[1] === '-' ? undefined : args[1];
        const amountStr = args[2];
        
        // Parse amount
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            sender.sendMessage(chalk.red(`Geçersiz miktar: ${amountStr}`));
            return true;
        }
        
        try {
            const posManager = this.#module.getPosManager();
            
            // Check if user already has active payment
            const existing = posManager.getPaymentByUser(payer);
            if (existing) {
                sender.sendMessage(chalk.yellow(`${payer} için zaten aktif bir ödeme var (ID: ${existing.getId()})`));
                sender.sendMessage(chalk.gray('Önce mevcut ödemeyi iptal edin veya tamamlanmasını bekleyin.'));
                return true;
            }
            
            // Create payment
            const description = receiver ? `${payer} → ${receiver}` : `${payer} ödemesi`;
            const payment = posManager.createPayment({
                username: payer,
                amount: amount,
                description: description,
                createdBy: sender.getName ? sender.getName() : 'Console'
            });
            
            sender.sendMessage(chalk.green(`✔ Ödeme oluşturuldu!`));
            sender.sendMessage(chalk.white(`ID: ${payment.getId()}`));
            sender.sendMessage(chalk.white(`Kullanıcı: ${payer}`));
            if (receiver) {
                sender.sendMessage(chalk.white(`Alıcı: ${receiver}`));
            }
            sender.sendMessage(chalk.white(`Miktar: ${amount.toFixed(2)}`));
            sender.sendMessage(chalk.gray(`${payer} kullanıcısı ${amount.toFixed(2)} göndermeli.`));
            
        } catch (e: unknown) {
            const error = e as Error;
            sender.sendMessage(chalk.red(`Hata: ${error.message || String(e)}`));
        }
        
        return true;
    }
    
    async tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> {
        // args[0] = payer username
        // args[1] = receiver username or "-"
        // args[2] = amount
        
        if (args.length === 1) {
            // Suggest online players for payer
            return Object.freeze([]);
        }
        
        if (args.length === 2) {
            // Suggest "-" or player names for receiver
            return Object.freeze(['-']);
        }
        
        return Object.freeze([]);
    }
}
