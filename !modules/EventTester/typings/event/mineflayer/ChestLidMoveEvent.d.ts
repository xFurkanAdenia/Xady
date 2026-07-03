import { XadyEvent } from "../XadyEvent";
export declare class ChestLidMoveEvent extends XadyEvent {
    private block;
    private isOpen;
    private block2;
    constructor(block: any, isOpen: number, block2: any);
    getBlock(): any;
    getIsOpen(): number;
    getBlock2(): any;
}
