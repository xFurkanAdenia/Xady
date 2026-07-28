import { XadyEvent } from "../XadyEvent";
import type Block from "prismarine-block";
import { Instrument } from "mineflayer";

export class NoteHeardEvent extends XadyEvent {
    private block: Block;
    private instrument: Instrument;
    private pitch: number;

    constructor(block: Block, instrument: Instrument, pitch: number) {
        super();
        this.block = block;
        this.instrument = instrument;
        this.pitch = pitch;
    }

    getBlock(): Block {
        return this.block;
    }

    getInstrument(): Instrument {
        return this.instrument;
    }

    getPitch(): number {
        return this.pitch;
    }
}
