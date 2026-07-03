import CommandSender from "../../../models/CommandSender";
import { Bot } from "../../../types";
import WheatHarvesterModule from "../index";

export default class WheatCommand extends Xady.Command {
    constructor() {
        super("wheat");
    }

    async execute(bot: Bot, sender: CommandSender, args: string[]): Promise<void> {
        const instance = WheatHarvesterModule.getInstance();
        if (!instance) return;

        if (args.length === 0) {
            return sender.sendMessage("Kullanım: !wheat <başlat/durdur>");
        }

        const action = args[0].toLowerCase();

        if (action === "başlat" || action === "start") {
            const permissible = instance.getPermissible();
            if (!permissible.getPermissionManager().hasPermission(sender, "wheat.harvest")) {
                return sender.sendMessage("Yetkin yok!");
            }
            if (instance.isHarvesting()) {
                return sender.sendMessage("WheatHarvester zaten çalışıyor.");
            }
            instance.startHarvesting();
            sender.sendMessage("WheatHarvester başlatıldı! Yetişmiş buğdaylar (Age 7) toplanacak.");
        } 
        else if (action === "durdur" || action === "stop") {
            const permissible = instance.getPermissible();
            if (!permissible.getPermissionManager().hasPermission(sender, "wheat.harvest")) {
                return sender.sendMessage("Yetkin yok!");
            }
            if (!instance.isHarvesting()) {
                return sender.sendMessage("WheatHarvester zaten çalışmıyor.");
            }
            instance.stopHarvesting();
            sender.sendMessage("WheatHarvester durduruldu.");
        }
        else {
            sender.sendMessage("Geçersiz işlem. Kullanım: !wheat <başlat/durdur>");
        }
    }
}