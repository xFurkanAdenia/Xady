import { XadyEvent } from "../XadyEvent";
export declare class EntityUpdateEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
