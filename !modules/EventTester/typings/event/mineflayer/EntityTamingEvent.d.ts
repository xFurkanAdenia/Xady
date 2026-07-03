import { XadyEvent } from "../XadyEvent";
export declare class EntityTamingEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
