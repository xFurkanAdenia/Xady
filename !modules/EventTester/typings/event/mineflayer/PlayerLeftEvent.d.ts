import { XadyEvent } from "../XadyEvent";
/**
 * Bir oyuncu sunucudan ayrıldığında tetiklenir
 */
export declare class PlayerLeftEvent extends XadyEvent {
    private player;
    constructor(player: any);
    getPlayer(): any;
    getUsername(): string;
    getUUID(): string;
}
