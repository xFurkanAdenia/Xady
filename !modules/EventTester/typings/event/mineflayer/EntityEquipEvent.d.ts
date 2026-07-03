import { XadyEvent } from "../XadyEvent";
export declare class EntityEquipEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
