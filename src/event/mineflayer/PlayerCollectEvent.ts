import { XadyEvent } from "../XadyEvent";
import { Entity } from "prismarine-entity";

export class PlayerCollectEvent extends XadyEvent {
    private collector: Entity;
    private collected: Entity;

    constructor(collector: Entity, collected: Entity) {
        super();
        this.collector = collector;
        this.collected = collected;
    }

    getCollector(): Entity {
        return this.collector;
    }

    getCollected(): Entity {
        return this.collected;
    }
}
