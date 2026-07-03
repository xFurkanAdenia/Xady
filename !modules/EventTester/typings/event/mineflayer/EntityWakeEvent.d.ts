import { XadyEvent } from "../XadyEvent";
export declare class EntityWakeEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
