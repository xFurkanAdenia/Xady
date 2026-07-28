export declare enum POS_PAYMENT_STATUS {
    PENDING = "pending",
    SUCCESS = "success",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
export interface PosPaymentData {
    id: string;
    username: string;
    amount: number;
    description: string;
    createdAt: number;
    completedAt?: number;
    status: POS_PAYMENT_STATUS;
    sendedMoney?: number;
    change?: number;
    createdBy: string;
}
export default class PosPayment {
    #private;
    constructor(data: Omit<PosPaymentData, "status"> & {
        status?: POS_PAYMENT_STATUS;
    });
    getId(): string;
    getUsername(): string;
    getAmount(): number;
    getDescription(): string;
    getCreatedAt(): number;
    getCompletedAt(): number | undefined;
    getStatus(): POS_PAYMENT_STATUS;
    getSendedMoney(): number | undefined;
    getChange(): number | undefined;
    getCreatedBy(): string;
    setStatus(status: POS_PAYMENT_STATUS): void;
    setCompletedAt(ts: number): void;
    setSendedMoney(amount: number): void;
    setChange(change: number): void;
    setCallback(cb: (payment: PosPayment) => void | Promise<void>): void;
    setTimeoutHandle(handle: NodeJS.Timeout): void;
    clearTimeoutHandle(): void;
    triggerCallback(): Promise<void>;
    toJSON(): PosPaymentData;
}
