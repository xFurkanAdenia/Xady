import { XadyEvent } from "../XadyEvent";
export declare class PlayerUpdatedEvent extends XadyEvent {
    private player;
    constructor(player: any);
    getPlayer(): any;
}
