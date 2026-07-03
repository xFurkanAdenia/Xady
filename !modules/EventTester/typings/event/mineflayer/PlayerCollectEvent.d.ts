import { XadyEvent } from "../XadyEvent";
export declare class PlayerCollectEvent extends XadyEvent {
    private collector;
    private collected;
    constructor(collector: any, collected: any);
    getCollector(): any;
    getCollected(): any;
}
