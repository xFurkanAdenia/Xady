import { XadyEvent } from "../XadyEvent";
export declare class WindowOpenEvent extends XadyEvent {
    private window;
    constructor(window: any);
    getWindow(): any;
}
