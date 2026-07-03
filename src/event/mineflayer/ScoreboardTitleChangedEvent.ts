import { XadyEvent } from "../XadyEvent";
import { ScoreBoard } from "mineflayer";

export class ScoreboardTitleChangedEvent extends XadyEvent {
    private scoreboard: ScoreBoard;

    constructor(scoreboard: ScoreBoard) {
        super();
        this.scoreboard = scoreboard;
    }

    getScoreboard(): ScoreBoard {
        return this.scoreboard;
    }
}
