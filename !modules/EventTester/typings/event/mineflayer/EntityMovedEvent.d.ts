import { XadyEvent } from "../XadyEvent";
export declare class EntityMovedEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
