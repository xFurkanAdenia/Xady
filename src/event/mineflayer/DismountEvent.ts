import { XadyEvent } from "../XadyEvent";
import type Entity from "prismarine-entity";

export class DismountEvent extends XadyEvent {
    private vehicle: Entity;

    constructor(vehicle: Entity) {
        super();
        this.vehicle = vehicle;
    }

    getVehicle(): Entity {
        return this.vehicle;
    }
}
