import { XadyEvent } from "../XadyEvent";
import { Block } from "prismarine-block";

export class ChestLidMoveEvent extends XadyEvent {
    private block: Block;
    private isOpen: number;
    private block2: Block | null;

    constructor(block: Block, isOpen: number, block2: Block | null) {
        super();
        this.block = block;
        this.isOpen = isOpen;
        this.block2 = block2;
    }

    getBlock(): Block {
        return this.block;
    }

    getIsOpen(): number {
        return this.isOpen;
    }

    getBlock2(): Block | null {
        return this.block2;
    }
}
