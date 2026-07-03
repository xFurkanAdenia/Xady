import { XadyEvent } from "../XadyEvent";
export declare class EntityHandSwapEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
