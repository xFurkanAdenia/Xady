import { XadyEvent } from "../XadyEvent";
export declare class EntitySwingArmEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
