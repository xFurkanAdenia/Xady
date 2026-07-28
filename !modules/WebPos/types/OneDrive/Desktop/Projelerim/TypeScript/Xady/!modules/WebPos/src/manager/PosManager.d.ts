import PosPayment from "../models/PosPayment";
import PosStorage from "../storage/PosStorage";
import type PosFunctionRegistry from "./PosFunctionRegistry";
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
    #private;
    constructor(config: PosConfig, storage: PosStorage, functionRegistry: PosFunctionRegistry);
    updateConfig(config: PosConfig): void;
    getConfig(): PosConfig;
    /**
     * Yeni ödeme oluştur (WebPanel'den tetiklenir)
     */
    createPayment(opts: {
        username: string;
        amount: number;
        description: string;
        createdBy: string;
        productId?: string;
    }): PosPayment;
    /**
     * Chat mesajından gelen para transferini işle
     * username: oyuncu adı, rawAmount: string olarak ham para değeri
     */
    handleIncomingPayment(username: string, rawAmount: string, bot: any): boolean;
    cancelPayment(id: string, bot?: any): boolean;
    refundPayment(id: string, amount: number, isPercentage: boolean, refundedBy: string, reason?: string, bot?: any): {
        success: boolean;
        error?: string;
        refundAmount?: number;
    };
    getPaymentByUser(username: string): PosPayment | null;
    getActivePaymentsByUser(username: string): PosPayment[];
    getPayment(id: string): PosPayment | undefined;
    getActivePayments(): PosPayment[];
    getCompletedPayments(): PosPayment[];
    getStorage(): PosStorage;
    onComplete(cb: PaymentEventListener): void;
    onCancel(cb: PaymentEventListener): void;
    onNew(cb: PaymentEventListener): void;
    clearListeners(): void;
    destroyAll(): void;
}
