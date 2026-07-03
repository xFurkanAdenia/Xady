import { XadyEvent } from "../XadyEvent";
import { ScoreBoard, DisplaySlot } from "mineflayer";

export class ScoreboardPositionEvent extends XadyEvent {
    private position: DisplaySlot;
    private scoreboard: ScoreBoard;

    constructor(position: DisplaySlot, scoreboard: ScoreBoard) {
        super();
        this.position = position;
        this.scoreboard = scoreboard;
    }

    getPosition(): DisplaySlot {
        return this.position;
    }

    getScoreboard(): ScoreBoard {
        return this.scoreboard;
    }
}
