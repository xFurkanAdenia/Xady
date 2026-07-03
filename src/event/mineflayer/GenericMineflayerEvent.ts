import { XadyEvent } from "../XadyEvent";

export class GenericMineflayerEvent extends XadyEvent {
    private originalEventName: string;
    private args: unknown[];

    constructor(eventName: string, args: unknown[]) {
        super();
        this.originalEventName = eventName;
        this.args = args;
    }

    getOriginalEventName(): string {
        return this.originalEventName;
    }

    getArgs(): unknown[] {
        return this.args;
    }
}
