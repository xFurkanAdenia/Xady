import { XadyEvent } from "../XadyEvent";
export declare class EntityEatEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
