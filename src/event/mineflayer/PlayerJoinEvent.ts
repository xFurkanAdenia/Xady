import { XadyEvent } from "../XadyEvent";
import { Player } from "mineflayer";

/**
 * Bir oyuncu sunucuya katıldığında tetiklenir
 */
export class PlayerJoinEvent extends XadyEvent {
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
