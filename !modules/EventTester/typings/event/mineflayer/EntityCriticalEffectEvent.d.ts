import { XadyEvent } from "../XadyEvent";
export declare class EntityCriticalEffectEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
}
