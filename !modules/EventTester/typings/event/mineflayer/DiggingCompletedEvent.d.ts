import { XadyEvent } from "../XadyEvent";
export declare class DiggingCompletedEvent extends XadyEvent {
    private block;
    constructor(block: any);
    getBlock(): any;
}
