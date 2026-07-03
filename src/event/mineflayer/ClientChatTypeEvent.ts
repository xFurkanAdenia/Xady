import { Cancellable } from "../Cancellable";
import { XadyEvent } from "../XadyEvent";

export class ClientChatTypeEvent extends XadyEvent implements Cancellable {
    private cancelled = false;
    private text: string = "";

    constructor(text: string) {
        super();
        this.text = text;
    }

    setCancelled(cancel: boolean): void {
        this.cancelled = cancel;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    getText() {
        return this.text;
    }
}