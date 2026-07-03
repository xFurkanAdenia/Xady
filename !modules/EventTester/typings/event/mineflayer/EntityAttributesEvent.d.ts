import { XadyEvent } from "../XadyEvent";
export declare class EntityAttributesEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
