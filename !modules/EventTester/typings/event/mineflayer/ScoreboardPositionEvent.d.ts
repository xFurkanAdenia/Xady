import { XadyEvent } from "../XadyEvent";
export declare class ScoreboardPositionEvent extends XadyEvent {
    private position;
    private scoreboard;
    constructor(position: any, scoreboard: any);
    getPosition(): any;
    getScoreboard(): any;
}
