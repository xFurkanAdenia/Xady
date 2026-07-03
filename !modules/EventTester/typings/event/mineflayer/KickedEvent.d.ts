import { XadyEvent } from "../XadyEvent";
/**
 * Bot sunucudan atıldığında tetiklenir
 */
export declare class KickedEvent extends XadyEvent {
    private reason;
    private loggedIn;
    constructor(reason: string, loggedIn: boolean);
    getReason(): string;
    isLoggedIn(): boolean;
}
