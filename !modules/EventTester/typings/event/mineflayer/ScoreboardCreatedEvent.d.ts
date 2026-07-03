import { XadyEvent } from "../XadyEvent";
export declare class ScoreboardCreatedEvent extends XadyEvent {
    private scoreboard;
    constructor(scoreboard: any);
    getScoreboard(): any;
}
