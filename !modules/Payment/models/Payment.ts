import PaymentModule from "..";
import PaymentError from "../error/PaymentError";

export enum PAYMENT_STATUS {
    PENDING = 0,
    SUCCESS = 1,
    FAILED = 2,
}


export default class Payment {
    #username: string;
    #amount: number;
    #id: number;
    #status: PAYMENT_STATUS;
    #reason: string;
    #change: number;
    #sendedMoney: number;
    #deleteAfterCallback: boolean;
    #callback: (payment: Payment) => Promise<void> | void
    constructor(id: number, username: string, amount: number, callback: (payment: Payment) => Promise<void> | void) {
        this.#username = username;
        this.#amount = amount;
        this.#id = id;
        this.#status = PAYMENT_STATUS.PENDING;
        this.#reason = ""
        this.#callback = callback;
        this.#change = -1;
        this.#sendedMoney = -1;
        this.#deleteAfterCallback = true;
    }

    getUsername() {
        return this.#username;
    }

    getAmount() {
        return this.#amount;
    }

    getId() {
        return this.#id;
    }

    getStatus() {
        return this.#status;
    }

    getReason() {
        return this.#reason;
    }

    getSendedMoney() {
        return this.#sendedMoney;
    }

    getChange() {
        return this.#change;
    }

    getDeleteAfterCallback() {
        return this.#deleteAfterCallback;
    }

    setDeleteAfterCallback(deleteAfterCallback: boolean) {
        this.#deleteAfterCallback = deleteAfterCallback;
    }
    
    async callback(payment: Payment) {
        await this.#callback(payment);
        if (this.#deleteAfterCallback) {
            this.delete();
        }
    }

    setChange(change: number) {
        this.#change = change;
    }

    setSendedMoney(sendedMoney: number) {
        this.#sendedMoney = sendedMoney;
    }

    setCallback(callback: (payment: Payment) => Promise<void> | void) {
        this.#callback = callback;
    }

    setReason(reason: string) {
        this.#reason = reason;
    }

    setStatus(status: PAYMENT_STATUS, reason?: string) {
        if (status === PAYMENT_STATUS.FAILED && !reason) {
            throw new PaymentError("Failed payment must have a reason.");
        }
        this.#status = status;
        this.#reason = reason || "";
    }

    delete() {
        PaymentModule.getInstance().getPaymentManager().deletePayment(this.#id);
    }
}