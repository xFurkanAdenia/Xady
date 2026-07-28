import { XadyEvent } from "../XadyEvent";
import type Entity from "prismarine-entity";

/**
 * Bir entity spawn olduğunda tetiklenir
 */
export class EntitySpawnEvent extends XadyEvent {
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

    getEntityName(): string | null {
        return (this.entity as unknown as { name?: string })?.name || null;
    }

    getPosition(): { x: number; y: number; z: number } {
        return (this.entity as any)?.position || { x: 0, y: 0, z: 0 };
    }
}
