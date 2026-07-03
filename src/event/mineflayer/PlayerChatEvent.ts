import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";

export class PlayerChatEvent extends XadyEvent implements Cancellable {
    private username: string;
    private message: string;
    private cancelled: boolean = false;

    constructor(username: string, message: string) {
        super();
        this.username = username;
        this.message = message;
    }

    getUsername(): string {
        return this.username;
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

    setCancelled(cancel: boolean): void {
        this.cancelled = cancel;
    }
}
