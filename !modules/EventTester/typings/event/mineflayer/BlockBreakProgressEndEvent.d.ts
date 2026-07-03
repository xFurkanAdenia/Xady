import { XadyEvent } from "../XadyEvent";
export declare class BlockBreakProgressEndEvent extends XadyEvent {
    private block;
    constructor(block: any);
    getBlock(): any;
}
