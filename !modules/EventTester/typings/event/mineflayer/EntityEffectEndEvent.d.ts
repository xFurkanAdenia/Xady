import { XadyEvent } from "../XadyEvent";
export declare class EntityEffectEndEvent extends XadyEvent {
    private entity;
    private effect;
    constructor(entity: any, effect: any);
    getEntity(): any;
    getEffect(): any;
}
