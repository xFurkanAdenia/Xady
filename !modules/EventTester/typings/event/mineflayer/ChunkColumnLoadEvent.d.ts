import { XadyEvent } from "../XadyEvent";
export declare class ChunkColumnLoadEvent extends XadyEvent {
    private point;
    constructor(point: any);
    getPoint(): any;
}
