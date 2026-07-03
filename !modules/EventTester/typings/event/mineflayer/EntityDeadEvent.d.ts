import { XadyEvent } from "../XadyEvent";
export declare class EntityDeadEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
