import { XadyEvent } from "../XadyEvent";
import { ScoreBoard } from "mineflayer";

export class ScoreUpdatedEvent extends XadyEvent {
    private scoreboard: ScoreBoard;
    private item: number;

    constructor(scoreboard: ScoreBoard, item: number) {
        super();
        this.scoreboard = scoreboard;
        this.item = item;
    }

    getScoreboard(): ScoreBoard {
        return this.scoreboard;
    }

    getItem(): number {
        return this.item;
    }
}
