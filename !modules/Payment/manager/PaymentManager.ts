import Payment from "../models/Payment";

export default class PaymentManager {
    #payments: Map<number, Payment>;
    #paymentIdOrder: number;

    constructor() {
        this.#payments = new Map();
        this.#paymentIdOrder = 0;
    }

    createPayment(username: string, amount: number, callback: (payment: Payment) => Promise<void> | void) {
        const payment = new Payment(this.#paymentIdOrder++, username, amount, callback);
        this.#payments.set(payment.getId(), payment);
        return payment;
    }

    getPayment(id: number) {
        return this.#payments.get(id);
    }

    getPaymentByUser(username: string) {
        const payments: Payment[] = []
        for (const payment of this.#payments.values()) {
            if (payment.getUsername() === username) {
                return payment;
            }
        }
        return null;
    }

    deletePayment(id:number) {
        this.#payments.delete(id);
    }
}