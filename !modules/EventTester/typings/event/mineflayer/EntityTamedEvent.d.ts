import { XadyEvent } from "../XadyEvent";
export declare class EntityTamedEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
