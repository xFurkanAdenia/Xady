import { XadyEvent } from "../XadyEvent";

export class TitleEvent extends XadyEvent {
    private text: string;
    private type: string;

    constructor(text: string, type: string) {
        super();
        this.text = text;
        this.type = type;
    }

    getText(): string {
        return this.text;
    }

    getType(): string {
        return this.type;
    }
}
