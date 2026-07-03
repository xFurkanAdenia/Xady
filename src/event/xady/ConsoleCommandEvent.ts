import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";

export class ConsoleCommandEvent extends XadyEvent implements Cancellable {
    private cancelled = false;
    private command: string;
    private args: string[];
    private label: string;

    constructor(command: string, args: string[]) {
        super();
        this.command = command;
        this.args = args;
        this.label = command;
    }

    getCommand(): string {
        return this.command;
    }

    getLabel(): string {
        return this.label;
    }

    getArgs(): string[] {
        return this.args;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    setCancelled(cancelled: boolean): void {
        this.cancelled = cancelled;
    }
}
