import WioCraftModule from "..";
import CommandSender from "../../../models/CommandSender"
import { Bot } from "../../../types"

export default class AutoReklam extends Xady.Command {
    NO_PERMISSION_MESSAGE = "Bu komutu kullanmak için gerekli izinlere sahip değilsin!"
    constructor() {
        super("autoreklam")
    }

    execute(bot: Bot, sender: CommandSender, args: string[]): void | Promise<void> {
        const instance = WioCraftModule.getInstance();
        const permissible = instance.getPermissible();
        const permissionsManager = permissible.getPermissionManager();
        if (!permissionsManager.hasPermission(sender, "autoreklam.use")) {
            sender.sendMessage(this.NO_PERMISSION_MESSAGE)
            return;
        }
        if (args.length < 1) {
            sender.sendMessage("Kullanım: !autoreklam <durum/satın-al/başlat/mesaj>")
            return;
        }

        const type = args[0].toLowerCase();
        const autoReklamManager = instance.getAutoReklamManager();
        const ad = autoReklamManager.getAd()
        if (type == "durum") {
            if (permissionsManager.hasPermission(sender, "autoreklam.status")) {
                if (ad) {
                    sender.sendMessage("Otomatik Reklam Durumu: " + ad.getStatus())
                } else {
                    sender.sendMessage("Otomatik Reklam Durumu: Aktif Değil")
                }
            } else {
                sender.sendMessage(this.NO_PERMISSION_MESSAGE)
            }
        } else if (type == "satın-al") {
            const payment = instance.getPayment();
            payment.getPaymentManager().createPayment(sender.getName(), 1000, () => sender.sendMessage("Otomatik Reklam Satın Alındı"));
        } else {
            sender.sendMessage(this.NO_PERMISSION_MESSAGE)
        }

    }

    
}