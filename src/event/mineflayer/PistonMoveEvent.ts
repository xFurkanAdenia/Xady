import { XadyEvent } from "../XadyEvent";
import type Block from "prismarine-block";

export class PistonMoveEvent extends XadyEvent {
    private block: Block;
    private isPulling: number;
    private direction: number;

    constructor(block: Block, isPulling: number, direction: number) {
        super();
        this.block = block;
        this.isPulling = isPulling;
        this.direction = direction;
    }

    getBlock(): Block {
        return this.block;
    }

    getIsPulling(): number {
        return this.isPulling;
    }

    getDirection(): number {
        return this.direction;
    }
}
