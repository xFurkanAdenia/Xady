import { XadyEvent } from "../XadyEvent";
import type Entity from "prismarine-entity";

export class EntityAttributesEvent extends XadyEvent {
    private entity: Entity;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    getEntity(): Entity {
        return this.entity;
    }
}
