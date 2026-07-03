import CommandSender from "../../../models/CommandSender";
import { Bot } from "../../../types";

export default class ScoreboardCommand extends Xady.Command {
    constructor() {
        super("sb");
    }

    async execute(bot: Bot, sender: CommandSender, args: string[]): Promise<void> {
        const scoreboards = bot.scoreboards;
        const scoreboardNames = Object.keys(scoreboards);

        if (scoreboardNames.length === 0) {
            return sender.sendMessage("Şu anda aktif bir scoreboard bulunamadı.");
        }

        // Skor tablolarını tek tek gönder
        for (const name of scoreboardNames) {
            const sb = scoreboards[name];
            const title = sb.title;
            const items = Object.values(sb.itemsMap);
            
            if (items.length === 0) continue;

            // Skorları değerlerine göre sırala (büyükten küçüğe)
            items.sort((a: any, b: any) => b.value - a.value);

            sender.sendMessage(`§6--- ${title} §6---`);
            
            for (const item of items as any[]) {
                sender.sendMessage(`§7${item.name}: §e${item.value}`);
            }
        }
    }
}
