import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";
/**
 * Bot'a whisper (fısıltı) mesajı geldiğinde tetiklenir
 */
export declare class WhisperEvent extends XadyEvent implements Cancellable {
    private username;
    private message;
    private translate;
    private cancelled;
    constructor(username: string, message: string, translate: string | null);
    getUsername(): string;
    getMessage(): string;
    getTranslate(): string | null;
    isCancelled(): boolean;
    setCancelled(cancel: boolean): void;
}
