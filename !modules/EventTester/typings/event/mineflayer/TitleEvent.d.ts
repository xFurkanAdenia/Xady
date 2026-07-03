import { XadyEvent } from "../XadyEvent";
export declare class TitleEvent extends XadyEvent {
    private text;
    private type;
    constructor(text: string, type: string);
    getText(): string;
    getType(): string;
}
