import PermissibleModule from ".."
import CommandSender from "../../../models/CommandSender"
import { Bot } from "../../../types"

export default class PermissibleCommand extends Xady.Command {
    constructor() {
        super("pmsb")
    }
    execute(bot: Bot, sender: InstanceType<XadyGlobal["CommandSender"]>, args: string[]): void | Promise<void> {
        const instance = PermissibleModule.getInstance();
        const permissionManager = instance.getPermissionManager();
        if (!permissionManager.hasPermission(sender, "pmsb.use")) return sender.sendMessage("Yetkin yok!");
        if (args.length < 1) return sender.sendMessage("Kullanım: /pmsb <give/remove/load/save>");
        const type = args[0].toLowerCase();

        if (type == "give") {
            if (!permissionManager.hasPermission(sender, "pmsb.give")) return sender.sendMessage("Yetkin yok!");
            if (args.length < 3) return sender.sendMessage("Kullanım: /pmsb give <isim> <perm>");
            const nick = args[1];
            const permName = args[2];
            if (!Object.keys(bot.players).includes(nick)) return sender.sendMessage("Bu oyuncu aktif değil!");
            const user = permissionManager.createUser(nick);
            user.addPermission(permName);
            sender.sendMessage("Başarılı!")
        } else if (type == "remove") {
            if (!permissionManager.hasPermission(sender, "pmsb.remove")) return sender.sendMessage("Yetkin yok!");
            if (args.length < 3) return sender.sendMessage("Kullanım: /pmsb remove <isim> <perm>");
            const nick = args[1];
            const permName = args[2];
            if (!Object.keys(bot.players).includes(nick)) return sender.sendMessage("Bu oyuncu aktif değil!");
            const user = permissionManager.createUser(nick);
            user.removePermission(permName);
            sender.sendMessage("Başarılı!")
        } else if (type == "load") {
            if (!permissionManager.hasPermission(sender, "pmsb.load")) return sender.sendMessage("Yetkin yok!");
            permissionManager.loadUsers();
            sender.sendMessage("Başarılı!")
        }
        else if (type == "save") {
            if (!permissionManager.hasPermission(sender, "pmsb.save")) return sender.sendMessage("Yetkin yok!");
            permissionManager.saveAll();
            sender.sendMessage("Başarılı!")
        }
    }
}