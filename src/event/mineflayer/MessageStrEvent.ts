import { XadyEvent } from "../XadyEvent";
import { ChatMessage } from "prismarine-chat";

export class MessageStrEvent extends XadyEvent {
    private message: string;
    private position: string;
    private jsonMsg: ChatMessage;

    constructor(message: string, position: string, jsonMsg: ChatMessage) {
        super();
        this.message = message;
        this.position = position;
        this.jsonMsg = jsonMsg;
    }

    getMessage(): string {
        return this.message;
    }

    getPosition(): string {
        return this.position;
    }

    getJsonMsg(): ChatMessage {
        return this.jsonMsg;
    }
}
