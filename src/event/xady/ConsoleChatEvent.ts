import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";

export class ConsoleChatEvent extends XadyEvent implements Cancellable {
    private cancelled = false;
    private message: string;

    constructor(message: string) {
        super();
        this.message = message;
    }

    getMessage(): string {
        return this.message;
    }

    setMessage(message: string): void {
        this.message = message;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    setCancelled(cancelled: boolean): void {
        this.cancelled = cancelled;
    }
}
