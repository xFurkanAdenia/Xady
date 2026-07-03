import { XadyEvent } from "../XadyEvent";
export declare class EntityEatingGrassEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
