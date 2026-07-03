import { XadyEvent } from "../XadyEvent";
export declare class ScoreboardDeletedEvent extends XadyEvent {
    private scoreboard;
    constructor(scoreboard: any);
    getScoreboard(): any;
}
