import { XadyEvent } from "../XadyEvent";
export declare class BossBarUpdatedEvent extends XadyEvent {
    private bossBar;
    constructor(bossBar: any);
    getBossBar(): any;
}
