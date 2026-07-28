import { XadyEvent } from "../XadyEvent";

export class GenericMineflayerEvent extends XadyEvent {
    readonly #originalEventName: string;
    readonly #args: readonly unknown[];

    constructor(eventName: string, args: readonly unknown[]) {
        super();
        this.#originalEventName = eventName;
        this.#args = Object.freeze([...args]);
    }

    getOriginalEventName(): string {
        return this.#originalEventName;
    }

    getArgs(): readonly unknown[] {
        return this.#args;
    }
}
