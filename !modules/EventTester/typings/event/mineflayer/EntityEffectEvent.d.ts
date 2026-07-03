import { XadyEvent } from "../XadyEvent";
export declare class EntityEffectEvent extends XadyEvent {
    private entity;
    private effect;
    constructor(entity: any, effect: any);
    getEntity(): any;
    getEffect(): any;
}
