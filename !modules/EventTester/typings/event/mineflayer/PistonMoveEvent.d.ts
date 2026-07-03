import { XadyEvent } from "../XadyEvent";
export declare class PistonMoveEvent extends XadyEvent {
    private block;
    private isPulling;
    private direction;
    constructor(block: any, isPulling: number, direction: number);
    getBlock(): any;
    getIsPulling(): number;
    getDirection(): number;
}
