import { XadyEvent } from "../XadyEvent";
import type Block from "prismarine-block";

export class BlockUpdateEvent extends XadyEvent {
    private oldBlock: Block | null;
    private newBlock: Block;

    constructor(oldBlock: Block | null, newBlock: Block) {
        super();
        this.oldBlock = oldBlock;
        this.newBlock = newBlock;
    }

    getOldBlock(): Block | null {
        return this.oldBlock;
    }

    getNewBlock(): Block {
        return this.newBlock;
    }
}
