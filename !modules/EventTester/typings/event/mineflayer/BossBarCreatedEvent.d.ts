import { XadyEvent } from "../XadyEvent";
export declare class BossBarCreatedEvent extends XadyEvent {
    private bossBar;
    constructor(bossBar: any);
    getBossBar(): any;
}
