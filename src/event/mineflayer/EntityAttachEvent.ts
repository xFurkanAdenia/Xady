import { XadyEvent } from "../XadyEvent";
import { Entity } from "prismarine-entity";

export class EntityAttachEvent extends XadyEvent {
    private entity: Entity;
    private vehicle: Entity;

    constructor(entity: Entity, vehicle: Entity) {
        super();
        this.entity = entity;
        this.vehicle = vehicle;
    }

    getEntity(): Entity {
        return this.entity;
    }

    getVehicle(): Entity {
        return this.vehicle;
    }
}
