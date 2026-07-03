import { XadyEvent } from "../XadyEvent";
export declare class UnmatchedMessageEvent extends XadyEvent {
    private stringMsg;
    private jsonMsg;
    constructor(stringMsg: string, jsonMsg: any);
    getStringMsg(): string;
    getJsonMsg(): any;
}
