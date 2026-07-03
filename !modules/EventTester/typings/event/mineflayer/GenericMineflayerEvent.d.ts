import { XadyEvent } from "../XadyEvent";
export declare class GenericMineflayerEvent extends XadyEvent {
    private originalEventName;
    private args;
    constructor(eventName: string, args: any[]);
    getOriginalEventName(): string;
    getArgs(): any[];
}
