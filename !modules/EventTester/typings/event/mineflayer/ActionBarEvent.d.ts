import { XadyEvent } from "../XadyEvent";
export declare class ActionBarEvent extends XadyEvent {
    private jsonMsg;
    constructor(jsonMsg: any);
    getJsonMsg(): any;
}
