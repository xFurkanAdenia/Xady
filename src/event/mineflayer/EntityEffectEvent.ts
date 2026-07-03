import { XadyEvent } from "../XadyEvent";
import { Entity } from "prismarine-entity";
import { Effect } from "mineflayer";

export class EntityEffectEvent extends XadyEvent {
    private entity: Entity;
    private effect: Effect;

    constructor(entity: Entity, effect: Effect) {
        super();
        this.entity = entity;
        this.effect = effect;
    }

    getEntity(): Entity {
        return this.entity;
    }

    getEffect(): Effect {
        return this.effect;
    }
}
