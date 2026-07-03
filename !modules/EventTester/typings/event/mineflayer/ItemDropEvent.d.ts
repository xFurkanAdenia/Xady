import { XadyEvent } from "../XadyEvent";
export declare class ItemDropEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
