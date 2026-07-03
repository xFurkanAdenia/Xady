export default class PaymentError extends Error {
    constructor(message: string) {
        super(message);
    }
}