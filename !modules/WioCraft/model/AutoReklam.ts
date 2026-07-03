export default class AutoReklam {
    private sended: number;
    private status: boolean;
    private owner: string;
    private message: string;
    private reason: string;
    private interval: bigint;
    private maxMessage: number;
    private price = 0.0;
    constructor(owner: string, message: string, interval: bigint, maxMessage: number) {
        this.sended = 0;
        this.status = false;
        this.owner = owner;
        this.message = message;
        this.reason = "";
        this.interval = interval;
        this.maxMessage = maxMessage;
    }

    getSended() {
        return this.sended;
    }
    getStatus() {
        return this.status;
    }
    getOwner() {
        return this.owner;
    }
    getMessage() {
        return this.message;
    }
    getReason() {
        return this.reason;
    }
    getInterval() {
        return this.interval;
    }
    getMaxMessage() {
        return this.maxMessage;
    }
    getPrice() {
        return this.price;
    }
    setPrice(price: number) {
        this.price = price;
    }
    setInterval(interval: bigint) {
        this.interval = interval;
    }
    setMaxMessage(maxMessage: number) {
        this.maxMessage = maxMessage;
    }
    setSended(sended: number) {
        this.sended = sended;
    }
    setStatus(status: boolean) {
        this.status = status;
    }
    setOwner(owner: string) {
        this.owner = owner;
    }
    setMessage(message: string) {
        this.message = message;
    }

    addSended(amount?: number) {
        this.sended += amount || 1;
    }

    removeSended(amount?: number) {
        this.sended -= amount || 1;
    }
    setReason(reason: string) {
        this.reason = reason;
    }
}