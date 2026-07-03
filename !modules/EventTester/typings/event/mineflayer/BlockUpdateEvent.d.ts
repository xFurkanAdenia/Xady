import { XadyEvent } from "../XadyEvent";
export declare class BlockUpdateEvent extends XadyEvent {
    private oldBlock;
    private newBlock;
    constructor(oldBlock: any, newBlock: any);
    getOldBlock(): any;
    getNewBlock(): any;
}
