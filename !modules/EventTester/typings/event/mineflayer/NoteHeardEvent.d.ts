import { XadyEvent } from "../XadyEvent";
export declare class NoteHeardEvent extends XadyEvent {
    private block;
    private instrument;
    private pitch;
    constructor(block: any, instrument: any, pitch: number);
    getBlock(): any;
    getInstrument(): any;
    getPitch(): number;
}
