import { XadyEvent } from "../XadyEvent";
export declare class BossBarDeletedEvent extends XadyEvent {
    private bossBar;
    constructor(bossBar: any);
    getBossBar(): any;
}
