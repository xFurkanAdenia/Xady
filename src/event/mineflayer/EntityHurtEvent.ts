import { XadyEvent } from "../XadyEvent";
import { Entity } from "prismarine-entity";

export class EntityHurtEvent extends XadyEvent {
    private entity: Entity;
    private source: Entity;

    constructor(entity: Entity, source: Entity) {
        super();
        this.entity = entity;
        this.source = source;
    }

    getEntity(): Entity {
        return this.entity;
    }

    getSource(): Entity {
        return this.source;
    }
}
