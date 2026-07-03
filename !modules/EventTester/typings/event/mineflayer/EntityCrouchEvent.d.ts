import { XadyEvent } from "../XadyEvent";
export declare class EntityCrouchEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
