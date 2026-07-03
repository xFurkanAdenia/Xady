import { XadyEvent } from "../XadyEvent";
export declare class MessageStrEvent extends XadyEvent {
    private message;
    private position;
    private jsonMsg;
    constructor(message: string, position: string, jsonMsg: any);
    getMessage(): string;
    getPosition(): string;
    getJsonMsg(): any;
}
