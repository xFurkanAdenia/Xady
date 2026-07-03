import PosPayment, { POS_PAYMENT_STATUS } from "../models/PosPayment";
import { randomUUID } from "crypto";
import PosStorage from "../storage/PosStorage";

export type PosConfig = {
    pattern: string;
    usernameIndex: number;
    amountIndex: number;
    decimalSeparator: "comma_decimal" | "dot_decimal";
    payCommand: string;
    paymentTimeoutMinutes: number;
    messages: {
        success: string;
        success_exact: string;
        insufficient: string;
        no_payment: string;
        refund: string;
    };
};

export type PaymentEventListener = (payment: PosPayment) => void;

export default class PosManager {
    #payments: Map<string, PosPayment> = new Map();
    #completedPayments: PosPayment[] = []; // son 100 tamamlanan ödeme
    #config: PosConfig;
    #storage: PosStorage;
    #onComplete: PaymentEventListener[] = [];
    #onCancel: PaymentEventListener[] = [];
    #onNew: PaymentEventListener[] = [];

    constructor(config: PosConfig, storage: PosStorage) {
        this.#config = config;
        this.#storage = storage;
        
        // Storage'dan tamamlanmış ödemeleri yükle
        this.#completedPayments = this.#storage.getPayments(100).map(data => new PosPayment(data));
    }

    updateConfig(config: PosConfig) {
        this.#config = config;
    }

    getConfig(): PosConfig {
        return this.#config;
    }

    /**
     * Yeni ödeme oluştur (WebPanel'den tetiklenir)
     */
    createPayment(opts: { username: string; amount: number; description: string; createdBy: string }): PosPayment {
        const id = randomUUID();
        const payment = new PosPayment({
            id,
            username: opts.username,
            amount: opts.amount,
            description: opts.description,
            createdAt: Date.now(),
            createdBy: opts.createdBy,
        });

        // Timeout kaydı
        const timeoutMs = this.#config.paymentTimeoutMinutes * 60 * 1000;
        const handle = setTimeout(() => {
            const p = this.#payments.get(id);
            if (p && p.getStatus() === POS_PAYMENT_STATUS.PENDING) {
                p.setStatus(POS_PAYMENT_STATUS.TIMEOUT);
                p.setCompletedAt(Date.now());
                this.#archivePayment(p);
                this.#onCancel.forEach(cb => cb(p));
            }
        }, timeoutMs);
        payment.setTimeoutHandle(handle);

        this.#payments.set(id, payment);
        this.#onNew.forEach(cb => cb(payment));
        return payment;
    }

    /**
     * Chat mesajından gelen para transferini işle
     * username: oyuncu adı, rawAmount: string olarak ham para değeri
     */
    handleIncomingPayment(username: string, rawAmount: string, bot: any): boolean {
        const amount = this.#parseAmount(rawAmount);
        if (isNaN(amount) || amount <= 0) return false;

        const payment = this.getPaymentByUser(username);
        if (!payment) {
            // Aktif ödeme yok - paranın geri iadesini yap
            const refundCmd = this.#config.payCommand
                .replace("{username}", username)
                .replace("{amount}", String(amount));
            bot?.chat(refundCmd);
            bot?.chat(refundCmd);
            if (this.#config.messages.no_payment) {
                bot?.whisper(username, this.#config.messages.no_payment);
            }
            return false;
        }

        if (payment.getStatus() !== POS_PAYMENT_STATUS.PENDING) return false;

        const required = payment.getAmount();

        if (amount < required) {
            // Yetersiz para - iade et
            const refundCmd = this.#config.payCommand
                .replace("{username}", username)
                .replace("{amount}", String(amount));
            bot?.chat(refundCmd);
            bot?.chat(refundCmd);
            const msg = this.#config.messages.insufficient.replace("{amount}", this.#formatAmount(required));
            bot?.whisper(username, msg);
            return false;
        }

        // Ödeme başarılı
        payment.clearTimeoutHandle();
        payment.setStatus(POS_PAYMENT_STATUS.SUCCESS);
        payment.setCompletedAt(Date.now());
        payment.setSendedMoney(amount);

        if (amount > required) {
            // Para üstü iade
            const change = parseFloat((amount - required).toFixed(2));
            payment.setChange(change);
            const changeCmd = this.#config.payCommand
                .replace("{username}", username)
                .replace("{amount}", String(change));
            bot?.chat(changeCmd);
            bot?.chat(changeCmd);
            const msg = this.#config.messages.success.replace("{change}", this.#formatAmount(change));
            bot?.whisper(username, msg);
        } else {
            payment.setChange(0);
            bot?.whisper(username, this.#config.messages.success_exact);
        }

        // Ödeme oluşturan kullanıcıya bakiye ekle
        const createdBy = payment.getCreatedBy();
        let user = this.#storage.getUser(createdBy);
        if (!user) {
            user = this.#storage.createUser(createdBy);
        }
        user.addBalance(required);
        this.#storage.saveUser(user);

        this.#archivePayment(payment);
        this.#payments.delete(payment.getId());
        this.#onComplete.forEach(cb => cb(payment));
        payment.triggerCallback();
        return true;
    }

    cancelPayment(id: string, bot?: any): boolean {
        const payment = this.#payments.get(id);
        if (!payment) return false;
        if (payment.getStatus() !== POS_PAYMENT_STATUS.PENDING) return false;

        payment.clearTimeoutHandle();
        payment.setStatus(POS_PAYMENT_STATUS.CANCELLED);
        payment.setCompletedAt(Date.now());

        // Eğer para gönderildiyse iade gerekebilir - bu senaryoda biz sadece iptal ediyoruz
        this.#archivePayment(payment);
        this.#payments.delete(id);
        this.#onCancel.forEach(cb => cb(payment));
        return true;
    }

    refundPayment(id: string, amount: number, isPercentage: boolean, refundedBy: string, reason: string = "", bot?: any): { success: boolean; error?: string; refundAmount?: number } {
        // Tamamlanmış ödemelerden bul
        const payment = this.#completedPayments.find(p => p.getId() === id);
        if (!payment) {
            return { success: false, error: "Ödeme bulunamadı" };
        }

        if (payment.getStatus() !== POS_PAYMENT_STATUS.SUCCESS) {
            return { success: false, error: "Sadece başarılı ödemeler iade edilebilir" };
        }

        const paidAmount = payment.getSendedMoney() || payment.getAmount();
        const alreadyRefunded = payment.getTotalRefunded();
        const availableAmount = paidAmount - alreadyRefunded;

        let refundAmount = amount;

        if (isPercentage) {
            if (amount < 0 || amount > 100) {
                return { success: false, error: "Yüzde değeri 0-100 arasında olmalıdır" };
            }
            refundAmount = (paidAmount * amount) / 100;
        }

        refundAmount = parseFloat(refundAmount.toFixed(2));

        if (refundAmount <= 0 || refundAmount > availableAmount) {
            return { success: false, error: `İade miktarı geçersiz. Kalan iade edilebilir miktar: ${this.#formatAmount(availableAmount)}⛁` };
        }

        // İade kaydını ekle
        payment.addRefund({
            id: randomUUID(),
            amount: refundAmount,
            refundedBy,
            refundedAt: Date.now(),
            reason: reason || undefined,
        });

        // İade işlemi
        const refundCmd = this.#config.payCommand
            .replace("{username}", payment.getUsername())
            .replace("{amount}", String(refundAmount));
        
        bot?.chat(refundCmd);
        bot?.chat(refundCmd);
        
        const msg = `İade işleminiz gerçekleştirildi. İade miktarı: ${this.#formatAmount(refundAmount)}`;
        bot?.whisper(payment.getUsername(), msg);

        return { success: true, refundAmount };
    }

    getPaymentByUser(username: string): PosPayment | null {
        for (const p of this.#payments.values()) {
            if (p.getUsername() === username && p.getStatus() === POS_PAYMENT_STATUS.PENDING) {
                return p;
            }
        }
        return null;
    }

    getPayment(id: string): PosPayment | undefined {
        return this.#payments.get(id) || this.#completedPayments.find(p => p.getId() === id);
    }

    getActivePayments(): PosPayment[] {
        return Array.from(this.#payments.values()).filter(p => p.getStatus() === POS_PAYMENT_STATUS.PENDING);
    }

    getCompletedPayments(): PosPayment[] {
        return [...this.#completedPayments];
    }

    getStorage(): PosStorage {
        return this.#storage;
    }

    onComplete(cb: PaymentEventListener) { this.#onComplete.push(cb); }
    onCancel(cb: PaymentEventListener) { this.#onCancel.push(cb); }
    onNew(cb: PaymentEventListener) { this.#onNew.push(cb); }

    clearListeners() {
        this.#onComplete = [];
        this.#onCancel = [];
        this.#onNew = [];
    }

    destroyAll() {
        for (const p of this.#payments.values()) {
            p.clearTimeoutHandle();
        }
        this.#payments.clear();
        this.clearListeners();
        this.#storage.destroy();
    }

    // ── private ──────────────────────────────────────────────────────────────

    #archivePayment(payment: PosPayment) {
        this.#completedPayments.unshift(payment);
        if (this.#completedPayments.length > 100) {
            this.#completedPayments.splice(100);
        }
        
        // Storage'a kaydet
        this.#storage.savePayment(payment.toJSON());
    }

    /**
     * Ham para string'ini sayıya çevirir.
     * comma_decimal: 1.234.567,89 → 1234567.89
     * dot_decimal: 1,234,567.89  → 1234567.89
     */
    #parseAmount(raw: string): number {
        let cleaned = raw.trim();
        if (this.#config.decimalSeparator === "comma_decimal") {
            // binler: nokta, ondalık: virgül
            cleaned = cleaned.replace(/\./g, "").replace(",", ".");
        } else {
            // binler: virgül, ondalık: nokta
            cleaned = cleaned.replace(/,/g, "");
        }
        return parseFloat(cleaned);
    }

    #formatAmount(num: number): string {
        if (this.#config.decimalSeparator === "comma_decimal") {
            return num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }
}
