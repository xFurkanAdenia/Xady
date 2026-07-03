import { XadyEvent } from "../XadyEvent";
export declare class ScoreRemovedEvent extends XadyEvent {
    private scoreboard;
    private item;
    constructor(scoreboard: any, item: number);
    getScoreboard(): any;
    getItem(): number;
}
