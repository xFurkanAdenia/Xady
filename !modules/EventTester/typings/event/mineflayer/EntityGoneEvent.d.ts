import { XadyEvent } from "../XadyEvent";
/**
 * Bir entity yok olduğunda tetiklenir
 */
export declare class EntityGoneEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
    getEntityId(): number;
    getEntityType(): string;
}
