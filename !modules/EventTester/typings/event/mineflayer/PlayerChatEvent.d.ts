import { XadyEvent } from "../XadyEvent";
import { Cancellable } from "../Cancellable";
export declare class PlayerChatEvent extends XadyEvent implements Cancellable {
    private username;
    private message;
    private cancelled;
    constructor(username: string, message: string);
    getUsername(): string;
    getMessage(): string;
    setMessage(message: string): void;
    isCancelled(): boolean;
    setCancelled(cancel: boolean): void;
}
