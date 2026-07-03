import { XadyEvent } from "../XadyEvent";

/**
 * Bot sunucudan atıldığında tetiklenir
 */
export class KickedEvent extends XadyEvent {
    private reason: string;
    private loggedIn: boolean;

    constructor(reason: string, loggedIn: boolean) {
        super();
        this.reason = reason;
        this.loggedIn = loggedIn;
    }

    getReason(): string {
        return this.reason;
    }

    isLoggedIn(): boolean {
        return this.loggedIn;
    }
}
