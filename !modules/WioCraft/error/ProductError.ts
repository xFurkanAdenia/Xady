export default class ProductError extends Error {
    constructor(message: string) {
        super(message)
        this.name = ProductError.name
    }
}