import { XadyEvent } from "../XadyEvent";
import type Entity from "prismarine-entity";

/**
 * Bir entity yok olduğunda tetiklenir
 */
export class EntityGoneEvent extends XadyEvent {
    private entity: Entity;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    getEntity(): Entity {
        return this.entity;
    }

    getEntityId(): number {
        return (this.entity as any)?.id || 0;
    }

    getEntityType(): string {
        return (this.entity as any)?.type || "unknown";
    }
}
