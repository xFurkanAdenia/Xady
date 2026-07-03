import { XadyEvent } from "../XadyEvent";
import { Player } from "mineflayer";

export class PlayerUpdatedEvent extends XadyEvent {
    private player: Player;

    constructor(player: Player) {
        super();
        this.player = player;
    }

    getPlayer(): Player {
        return this.player;
    }
}
