import { XadyEvent } from "../XadyEvent";
export declare class ChunkColumnUnloadEvent extends XadyEvent {
    private point;
    constructor(point: any);
    getPoint(): any;
}
