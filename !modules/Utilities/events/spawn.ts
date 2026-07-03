import { BotEvents, BotOptions } from "mineflayer";
import UtilitiesModule from ".."
import createBot from "../../../functions/bot/createBot";

export default class EndEvent extends Xady.Event<any> {
    private server: string;
    constructor() {
        super({
            name: "login"
        });
        this.server = "Lobby"
    }

    execute(...args: unknown[]): Promise<void> | void {
        // const instance = UtilitiesModule.getInstance();
        // const client = instance.getClient();
        // const bot = client.getBot();
        // bot?.addChatPattern("swTsSurvival", /MELONYA ⇴ Aktarıldığın Sunucu: Survival/, { repeat: true, parse: true })
        // bot?.on("chat:swTsSurvival" as keyof BotEvents, () => {
        //     this.server = "Survival"
        // });
        // bot?.awaitMessage(/You are already connected to this server!/).then(() => this.server = "Survival")
        // const Class = this;
        // const interval = setInterval(() => {
        //     if (Class.server != "Survival") bot?.chat("/survival");
        //     else clearInterval(interval);
        // }, 1000)
        // bot?.chat("/survival");
        // if (this.server == "Survival") setTimeout(() => bot?.whisper("xFurkanAdenia", "Geldim naber"), 1500)
    }
}