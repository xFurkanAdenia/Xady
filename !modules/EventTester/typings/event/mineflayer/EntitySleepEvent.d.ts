import { XadyEvent } from "../XadyEvent";
export declare class EntitySleepEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
