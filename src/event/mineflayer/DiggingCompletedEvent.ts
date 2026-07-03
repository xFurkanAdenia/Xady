import { XadyEvent } from "../XadyEvent";
import { Block } from "prismarine-block";

export class DiggingCompletedEvent extends XadyEvent {
    private block: Block;

    constructor(block: Block) {
        super();
        this.block = block;
    }

    getBlock(): Block {
        return this.block;
    }
}
