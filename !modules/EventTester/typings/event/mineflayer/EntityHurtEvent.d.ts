import { XadyEvent } from "../XadyEvent";
export declare class EntityHurtEvent extends XadyEvent {
    private entity;
    private source;
    constructor(entity: any, source: any);
    getEntity(): any;
    getSource(): any;
}
