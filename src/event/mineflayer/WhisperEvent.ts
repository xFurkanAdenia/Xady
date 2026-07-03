import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";

/**
 * Bot'a whisper (fısıltı) mesajı geldiğinde tetiklenir
 */
export class WhisperEvent extends XadyEvent implements Cancellable {
    private username: string;
    private message: string;
    private translate: string | null;
    private cancelled: boolean = false;

    constructor(username: string, message: string, translate: string | null) {
        super();
        this.username = username;
        this.message = message;
        this.translate = translate;
    }

    getUsername(): string {
        return this.username;
    }

    getMessage(): string {
        return this.message;
    }

    getTranslate(): string | null {
        return this.translate;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    setCancelled(cancel: boolean): void {
        this.cancelled = cancel;
    }
}
