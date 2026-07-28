import PosPayment from "../models/PosPayment";
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
    constructor(config: PosConfig);
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
    }): PosPayment;
    /**
     * Chat mesajından gelen para transferini işle
     * username: oyuncu adı, rawAmount: string olarak ham para değeri
     */
    handleIncomingPayment(username: string, rawAmount: string, bot: any): boolean;
    cancelPayment(id: string, bot?: any): boolean;
    getPaymentByUser(username: string): PosPayment | null;
    getPayment(id: string): PosPayment | undefined;
    getActivePayments(): PosPayment[];
    getCompletedPayments(): PosPayment[];
    onComplete(cb: PaymentEventListener): void;
    onCancel(cb: PaymentEventListener): void;
    onNew(cb: PaymentEventListener): void;
    clearListeners(): void;
    destroyAll(): void;
}
