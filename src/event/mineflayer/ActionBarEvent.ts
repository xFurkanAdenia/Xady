import { XadyEvent } from "../XadyEvent";
import { ChatMessage } from "prismarine-chat";

export class ActionBarEvent extends XadyEvent {
    private jsonMsg: ChatMessage;

    constructor(jsonMsg: ChatMessage) {
        super();
        this.jsonMsg = jsonMsg;
    }

    getJsonMsg(): ChatMessage {
        return this.jsonMsg;
    }
}
