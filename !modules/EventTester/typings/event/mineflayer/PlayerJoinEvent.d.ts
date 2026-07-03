import { XadyEvent } from "../XadyEvent";
/**
 * Bir oyuncu sunucuya katıldığında tetiklenir
 */
export declare class PlayerJoinEvent extends XadyEvent {
    private player;
    constructor(player: any);
    getPlayer(): any;
    getUsername(): string;
    getUUID(): string;
}
