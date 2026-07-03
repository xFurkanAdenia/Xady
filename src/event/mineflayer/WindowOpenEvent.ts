import { XadyEvent } from "../XadyEvent";
import { Window } from "prismarine-windows";

export class WindowOpenEvent extends XadyEvent {
    private window: Window;

    constructor(window: Window) {
        super();
        this.window = window;
    }

    getWindow(): Window {
        return this.window;
    }
}
