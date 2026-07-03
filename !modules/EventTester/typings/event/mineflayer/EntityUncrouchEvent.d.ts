import { XadyEvent } from "../XadyEvent";
export declare class EntityUncrouchEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
