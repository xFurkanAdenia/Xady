import { XadyEvent } from "../XadyEvent";
import { Player } from "mineflayer";

/**
 * Bir oyuncu sunucudan ayrıldığında tetiklenir
 */
export class PlayerLeftEvent extends XadyEvent {
    private player: Player;

    constructor(player: Player) {
        super();
        this.player = player;
    }

    getPlayer(): Player {
        return this.player;
    }

    getUsername(): string {
        return this.player?.username || "";
    }

    getUUID(): string {
        return (this.player as unknown as { uuid?: string })?.uuid || "";
    }
}
