import { XadyEvent } from "../XadyEvent";
import { BossBar } from "mineflayer";

export class BossBarCreatedEvent extends XadyEvent {
    private bossBar: BossBar;

    constructor(bossBar: BossBar) {
        super();
        this.bossBar = bossBar;
    }

    getBossBar(): BossBar {
        return this.bossBar;
    }
}
