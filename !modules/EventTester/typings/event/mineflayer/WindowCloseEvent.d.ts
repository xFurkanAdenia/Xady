import { XadyEvent } from "../XadyEvent";
export declare class WindowCloseEvent extends XadyEvent {
    private window;
    constructor(window: any);
    getWindow(): any;
}
