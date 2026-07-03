// PosPayment model - tekilleştirilmiş ödeme nesnesi

export enum POS_PAYMENT_STATUS {
    PENDING = "pending",
    SUCCESS = "success",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout",
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
    createdBy: string; // webpanel kullanıcı adı
}

export default class PosPayment {
    #data: PosPaymentData;
    #callback?: (payment: PosPayment) => void | Promise<void>;
    #timeoutHandle?: NodeJS.Timeout;

    constructor(data: Omit<PosPaymentData, "status"> & { status?: POS_PAYMENT_STATUS }) {
        this.#data = {
            ...data,
            status: data.status ?? POS_PAYMENT_STATUS.PENDING,
        };
    }

    getId() { return this.#data.id; }
    getUsername() { return this.#data.username; }
    getAmount() { return this.#data.amount; }
    getDescription() { return this.#data.description; }
    getCreatedAt() { return this.#data.createdAt; }
    getCompletedAt() { return this.#data.completedAt; }
    getStatus() { return this.#data.status; }
    getSendedMoney() { return this.#data.sendedMoney; }
    getChange() { return this.#data.change; }
    getCreatedBy() { return this.#data.createdBy; }

    setStatus(status: POS_PAYMENT_STATUS) {
        this.#data.status = status;
    }

    setCompletedAt(ts: number) {
        this.#data.completedAt = ts;
    }

    setSendedMoney(amount: number) {
        this.#data.sendedMoney = amount;
    }

    setChange(change: number) {
        this.#data.change = change;
    }

    setCallback(cb: (payment: PosPayment) => void | Promise<void>) {
        this.#callback = cb;
    }

    setTimeoutHandle(handle: NodeJS.Timeout) {
        this.#timeoutHandle = handle;
    }

    clearTimeoutHandle() {
        if (this.#timeoutHandle) {
            clearTimeout(this.#timeoutHandle);
            this.#timeoutHandle = undefined;
        }
    }

    async triggerCallback() {
        if (this.#callback) {
            await this.#callback(this);
        }
    }

    toJSON(): PosPaymentData {
        return { ...this.#data };
    }
}
