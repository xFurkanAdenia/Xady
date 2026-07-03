import { BotEvents } from "mineflayer";
import WioCraftModule from "..";
import notifier from "node-notifier";

export default interface MessageEventData {
    level: string;
    rank: string;
    nick: string;
    message: string;
}

async function wait(ms: number) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}
export default class MessageEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "wiocraft_message",
            // Regex - parantezler capture group'ları oluşturur
            pattern: /^(?:([\d,\.]+K?)\s*\|\s*)?(\S+)\s+(\S+)\s+▸\s+(.*)$/,
            patternOptions: {
                repeat: true,
                parse: true
            }
        })
    }

    async execute(matches: any): Promise<void> {
        // if (!Array.isArray(matches)) return;

        const [level, rank, nick, message] = matches[0];

        const instance = WioCraftModule.getInstance();
        const permissible = instance.getPermissible();
        const bot = instance.getClient().getBot();
        if (!message) return;

        bot?.emit("wiocraft:chat" as any, { level, rank, nick, message })
        if (message == instance.getClient().getBot()?.username) {
            if (permissible.getPermissionManager().hasPermission(nick, "wiocraft.hi")) {
                bot?.chat("Efendim")
            }
        }

        if (message.toLowerCase().includes("rehber") || message.toLowerCase().includes("xfurkanadenia")) {
            new notifier.WindowsToaster().notify({
                title: "WioCraft",
                message: "Etiketlendiniz."
            })
            bot?.whisper("xFurkanAdenia", "xFurkanAdenia etiketlendin");
            await wait(300)
            bot?.whisper("xFurkanAdenia", "xFurkanAdenia etiketlendin");
            await wait(300)
            bot?.whisper("xFurkanAdenia", "xFurkanAdenia etiketlendin");

        }
    }
}