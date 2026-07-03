import { XadyEvent } from "../XadyEvent";
/**
 * Bir entity spawn olduğunda tetiklenir
 */
export declare class EntitySpawnEvent extends XadyEvent {
    private entity;
    constructor(entity: any);
    getEntity(): any;
    getEntityId(): number;
    getEntityType(): string;
    getEntityName(): string | null;
    getPosition(): {
        x: number;
        y: number;
        z: number;
    };
}
