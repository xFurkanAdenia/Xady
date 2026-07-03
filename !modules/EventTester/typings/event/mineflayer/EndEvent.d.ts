import { XadyEvent } from "../XadyEvent";
/**
 * Bot bağlantısı koptuğunda tetiklenir
 */
export declare class EndEvent extends XadyEvent {
    private reason;
    constructor(reason: string);
    getReason(): string;
}
