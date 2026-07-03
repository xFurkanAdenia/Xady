import { XadyEvent } from "../XadyEvent";
export declare class BlockBreakProgressObservedEvent extends XadyEvent {
    private block;
    private destroyStage;
    constructor(block: any, destroyStage: number);
    getBlock(): any;
    getDestroyStage(): number;
}
