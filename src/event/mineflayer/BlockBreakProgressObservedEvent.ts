import { XadyEvent } from "../XadyEvent";
import { Block } from "prismarine-block";

export class BlockBreakProgressObservedEvent extends XadyEvent {
    private block: Block;
    private destroyStage: number;

    constructor(block: Block, destroyStage: number) {
        super();
        this.block = block;
        this.destroyStage = destroyStage;
    }

    getBlock(): Block {
        return this.block;
    }

    getDestroyStage(): number {
        return this.destroyStage;
    }
}
