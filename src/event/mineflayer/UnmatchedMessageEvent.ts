import { XadyEvent } from "../XadyEvent";
import { ChatMessage } from "prismarine-chat";

export class UnmatchedMessageEvent extends XadyEvent {
    private stringMsg: string;
    private jsonMsg: ChatMessage;

    constructor(stringMsg: string, jsonMsg: ChatMessage) {
        super();
        this.stringMsg = stringMsg;
        this.jsonMsg = jsonMsg;
    }

    getStringMsg(): string {
        return this.stringMsg;
    }

    getJsonMsg(): ChatMessage {
        return this.jsonMsg;
    }
}
