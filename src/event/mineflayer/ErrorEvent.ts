import { XadyEvent } from "../XadyEvent";

/**
 * Bot'ta bir hata oluştuğunda tetiklenir
 */
export class ErrorEvent extends XadyEvent {
    private error: Error;

    constructor(error: Error) {
        super();
        this.error = error;
    }

    getError(): Error {
        return this.error;
    }

    getMessage(): string {
        return this.error.message;
    }

    getStack(): string | undefined {
        return this.error.stack;
    }
}
