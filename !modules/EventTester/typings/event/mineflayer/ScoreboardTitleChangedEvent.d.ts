import { XadyEvent } from "../XadyEvent";
export declare class ScoreboardTitleChangedEvent extends XadyEvent {
    private scoreboard;
    constructor(scoreboard: any);
    getScoreboard(): any;
}
