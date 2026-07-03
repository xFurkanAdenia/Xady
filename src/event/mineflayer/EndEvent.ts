import { XadyEvent } from "../XadyEvent";

/**
 * Bot bağlantısı koptuğunda tetiklenir
 */
export class EndEvent extends XadyEvent {
    private reason: string;

    constructor(reason: string) {
        super();
        this.reason = reason;
    }

    getReason(): string {
        return this.reason;
    }
}
