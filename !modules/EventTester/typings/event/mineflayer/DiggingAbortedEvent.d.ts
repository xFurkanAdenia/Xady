import { XadyEvent } from "../XadyEvent";
export declare class DiggingAbortedEvent extends XadyEvent {
    private block;
    constructor(block: any);
    getBlock(): any;
}
