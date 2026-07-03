import { XadyEvent } from "../XadyEvent";
/**
 * Bot'ta bir hata oluştuğunda tetiklenir
 */
export declare class ErrorEvent extends XadyEvent {
    private error;
    constructor(error: Error);
    getError(): Error;
    getMessage(): string;
    getStack(): string | undefined;
}
