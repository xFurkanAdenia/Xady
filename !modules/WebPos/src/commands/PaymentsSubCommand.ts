/**
 * Payments SubCommand - List payments
 * Usage: !webpos payments [username]
 */

import type WebPosModule from "../index";
import { POS_PAYMENT_STATUS } from "../models/PosPayment";
import chalk from "chalk";

export class PaymentsSubCommand {
    readonly name = 'payments';
    readonly aliases = Object.freeze(['list', 'ls']) as readonly string[];
    readonly description = 'Ödemeleri listele';
    readonly usage = '!webpos payments [kullanıcı-adı]';
    
    readonly #module: WebPosModule;
    
    constructor(module: WebPosModule) {
        this.#module = module;
    }
    
    async execute(sender: any, args: readonly string[]): Promise<boolean> {
        const username = args[0];
        const posManager = this.#module.getPosManager();
        
        if (username) {
            // Show specific user's payments
            return this.#showUserPayments(sender, username);
        }
        
        // Show all payments
        return this.#showAllPayments(sender);
    }
    
    #showUserPayments(sender: any, username: string): boolean {
        const posManager = this.#module.getPosManager();
        
        // Get active payment
        const activePayment = posManager.getPaymentByUser(username);
        
        // Get completed payments
        const completedPayments = posManager.getCompletedPayments()
            .filter(p => p.getUsername() === username)
            .slice(0, 10); // Last 10
        
        sender.sendMessage(chalk.cyan(`━━━ ${username} Ödemeleri ━━━`));
        sender.sendMessage('');
        
        // Active payment
        if (activePayment) {
            sender.sendMessage(chalk.yellow('📋 Aktif Ödeme:'));
            this.#displayPayment(sender, activePayment);
            sender.sendMessage('');
        }
        
        // Completed payments
        if (completedPayments.length > 0) {
            sender.sendMessage(chalk.gray(`📜 Son ${completedPayments.length} Tamamlanan Ödeme:`));
            for (const payment of completedPayments) {
                this.#displayPayment(sender, payment);
            }
        } else {
            sender.sendMessage(chalk.gray('Tamamlanmış ödeme bulunamadı.'));
        }
        
        return true;
    }
    
    #showAllPayments(sender: any): boolean {
        const posManager = this.#module.getPosManager();
        const activePayments = posManager.getActivePayments();
        const completedPayments = posManager.getCompletedPayments().slice(0, 20);
        
        sender.sendMessage(chalk.cyan('━━━ Tüm Ödemeler ━━━'));
        sender.sendMessage('');
        
        // Active payments table
        if (activePayments.length > 0) {
            sender.sendMessage(chalk.yellow(`📋 Aktif Ödemeler (${activePayments.length}):`));
            sender.sendMessage('');
            
            // Table header
            sender.sendMessage(chalk.bold('ID                                   │ Kullanıcı    │ Miktar    │ Süre'));
            sender.sendMessage('─────────────────────────────────────┼──────────────┼───────────┼──────────');
            
            for (const payment of activePayments) {
                const id = payment.getId().substring(0, 36).padEnd(36);
                const user = payment.getUsername().substring(0, 12).padEnd(12);
                const amount = payment.getAmount().toFixed(2).padStart(9);
                const elapsed = this.#formatElapsed(Date.now() - payment.getCreatedAt());
                
                sender.sendMessage(`${chalk.white(id)} │ ${chalk.cyan(user)} │ ${chalk.green(amount)} │ ${chalk.gray(elapsed)}`);
            }
            
            sender.sendMessage('');
        }
        
        // Completed payments table
        if (completedPayments.length > 0) {
            sender.sendMessage(chalk.gray(`📜 Tamamlanan Ödemeler (Son ${completedPayments.length}):`));
            sender.sendMessage('');
            
            // Table header
            sender.sendMessage(chalk.bold('ID (8)   │ Kullanıcı    │ Miktar    │ Durum    │ Zaman'));
            sender.sendMessage('──────────┼──────────────┼───────────┼──────────┼────────────');
            
            for (const payment of completedPayments) {
                const id = payment.getId().substring(0, 8);
                const user = payment.getUsername().substring(0, 12).padEnd(12);
                const amount = payment.getAmount().toFixed(2).padStart(9);
                const status = this.#getStatusIcon(payment.getStatus());
                const time = this.#formatTime(payment.getCompletedAt() || payment.getCreatedAt());
                
                sender.sendMessage(`${chalk.gray(id)} │ ${chalk.cyan(user)} │ ${chalk.green(amount)} │ ${status} │ ${chalk.gray(time)}`);
            }
            
            sender.sendMessage('');
        }
        
        if (activePayments.length === 0 && completedPayments.length === 0) {
            sender.sendMessage(chalk.gray('Hiç ödeme bulunamadı.'));
        }
        
        sender.sendMessage(chalk.gray('Detay için: !webpos payments <kullanıcı-adı>'));
        
        return true;
    }
    
    #displayPayment(sender: any, payment: any): void {
        const status = this.#getStatusIcon(payment.getStatus());
        const id = payment.getId().substring(0, 16) + '...';
        
        sender.sendMessage(`  ${status} ID: ${chalk.gray(id)}`);
        sender.sendMessage(`     Miktar: ${chalk.green(payment.getAmount().toFixed(2))}`);
        sender.sendMessage(`     Açıklama: ${chalk.white(payment.getDescription())}`);
        
        if (payment.getStatus() === POS_PAYMENT_STATUS.SUCCESS) {
            sender.sendMessage(`     Gönderilen: ${chalk.cyan(payment.getSendedMoney().toFixed(2))}`);
            if (payment.getChange() > 0) {
                sender.sendMessage(`     Para Üstü: ${chalk.yellow(payment.getChange().toFixed(2))}`);
            }
        }
        
        const createdTime = this.#formatTime(payment.getCreatedAt());
        sender.sendMessage(`     Oluşturulma: ${chalk.gray(createdTime)}`);
        
        if (payment.getCompletedAt()) {
            const completedTime = this.#formatTime(payment.getCompletedAt());
            sender.sendMessage(`     Tamamlanma: ${chalk.gray(completedTime)}`);
        }
    }
    
    #getStatusIcon(status: POS_PAYMENT_STATUS): string {
        switch (status) {
            case POS_PAYMENT_STATUS.PENDING: return chalk.yellow('⌛');
            case POS_PAYMENT_STATUS.SUCCESS: return chalk.green('✔');
            case POS_PAYMENT_STATUS.CANCELLED: return chalk.red('✖');
            case POS_PAYMENT_STATUS.TIMEOUT: return chalk.red('⏱');
            default: return chalk.gray('?');
        }
    }
    
    #formatElapsed(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
    
    #formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    
    async tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> {
        // Suggest usernames with active or recent payments
        if (args.length === 1) {
            const posManager = this.#module.getPosManager();
            const activePayments = posManager.getActivePayments();
            const completedPayments = posManager.getCompletedPayments().slice(0, 10);
            
            const usernames = new Set<string>();
            for (const p of [...activePayments, ...completedPayments]) {
                usernames.add(p.getUsername());
            }
            
            return Object.freeze(Array.from(usernames).sort());
        }
        
        return Object.freeze([]);
    }
}
