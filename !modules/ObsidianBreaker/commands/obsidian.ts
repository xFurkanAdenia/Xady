import CommandSender from "../../../models/CommandSender";
import { Bot } from "../../../types";
import ObsidianBreakerModule from "../index";

export default class ObsidianCommand extends Xady.Command {
    constructor() {
        super("obsidian");
    }

    async execute(bot: Bot, sender: CommandSender, args: string[]): Promise<void> {
        const instance = ObsidianBreakerModule.getInstance();
        if (!instance) return;

        if (args.length === 0) {
            return sender.sendMessage("Kullanım: !obsidian <başlat/durdur>");
        }

        const action = args[0].toLowerCase();

        if (action === "başlat" || action === "start") {
            if (instance.isBreaking()) {
                return sender.sendMessage("ObsidianBreaker zaten çalışıyor.");
            }
            instance.startBreaking();
            sender.sendMessage("ObsidianBreaker başlatıldı!");
        } 
        else if (action === "durdur" || action === "stop") {
            if (!instance.isBreaking()) {
                return sender.sendMessage("ObsidianBreaker zaten çalışmıyor.");
            }
            instance.stopBreaking();
            sender.sendMessage("ObsidianBreaker durduruldu.");
        }
        else {
            sender.sendMessage("Geçersiz işlem. Kullanım: !obsidian <başlat/durdur>");
        }
    }
}