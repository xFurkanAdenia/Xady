import { XadyEvent } from "../XadyEvent";
import { Entity } from "prismarine-entity";

export class EntityTamedEvent extends XadyEvent {
    private entity: Entity;

    constructor(entity: Entity) {
        super();
        this.entity = entity;
    }

    getEntity(): Entity {
        return this.entity;
    }
}
