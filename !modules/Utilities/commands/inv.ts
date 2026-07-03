import CommandSender from "../../../models/CommandSender";
import { Bot } from "../../../types";

export default class InventoryCommand extends Xady.Command {
    constructor() {
        super("inv");
    }

    async execute(bot: Bot, sender: CommandSender, args: string[]): Promise<void> {
        if (args.length === 0) {
            return sender.sendMessage("Kullanım: !inv <list/at/giy/at-hepsi>");
        }

        const action = args[0].toLowerCase();

        switch (action) {
            case "list":
            case "liste":
                this.listInventory(bot, sender);
                break;
            case "at":
            case "drop":
                await this.dropItem(bot, sender, args.slice(1));
                break;
            case "giy":
            case "equip":
                await this.equipItem(bot, sender, args.slice(1));
                break;
            case "at-hepsi":
            case "dropall":
                await this.dropAll(bot, sender);
                break;
            default:
                sender.sendMessage("Geçersiz işlem. Kullanım: !inv <list/at/giy/at-hepsi>");
                break;
        }
    }

    private listInventory(bot: Bot, sender: CommandSender) {
        const items = bot.inventory.items();
        if (items.length === 0) {
            return sender.sendMessage("Envanter boş.");
        }

        const itemList = items.map(item => `${item.displayName} x${item.count}`).join(", ");
        sender.sendMessage(`Envanter: ${itemList}`);
    }

    private async dropItem(bot: Bot, sender: CommandSender, args: string[]) {
        if (args.length === 0) {
            return sender.sendMessage("Atılacak eşyanın adını yazın.");
        }

        const itemName = args.join(" ").toLowerCase();
        const item = bot.inventory.items().find(i => i.displayName.toLowerCase().includes(itemName) || i.name.toLowerCase().includes(itemName));

        if (!item) {
            return sender.sendMessage(`Envanterde '${itemName}' bulunamadı.`);
        }

        try {
            await bot.tossStack(item);
            sender.sendMessage(`${item.displayName} x${item.count} yere atıldı.`);
        } catch (err) {
            sender.sendMessage("Eşya atılırken bir hata oluştu.");
        }
    }

    private async dropAll(bot: Bot, sender: CommandSender) {
        const items = bot.inventory.items();
        if (items.length === 0) {
            return sender.sendMessage("Envanter zaten boş.");
        }

        sender.sendMessage("Tüm envanter boşaltılıyor...");
        try {
            for (const item of items) {
                await bot.tossStack(item);
            }
            sender.sendMessage("Tüm envanter boşaltıldı.");
        } catch (err) {
            sender.sendMessage("Envanter boşaltılırken bir hata oluştu.");
        }
    }

    private async equipItem(bot: Bot, sender: CommandSender, args: string[]) {
        if (args.length === 0) {
            return sender.sendMessage("Giyilecek eşyanın adını yazın.");
        }

        const itemName = args.join(" ").toLowerCase();
        const item = bot.inventory.items().find(i => i.displayName.toLowerCase().includes(itemName) || i.name.toLowerCase().includes(itemName));

        if (!item) {
            return sender.sendMessage(`Envanterde '${itemName}' bulunamadı.`);
        }

        try {
            // Basit bir giyme mantığı: eline al
            await bot.equip(item, 'hand');
            sender.sendMessage(`${item.displayName} eline alındı.`);
        } catch (err) {
            sender.sendMessage("Eşya giyilirken/kuşanılırken bir hata oluştu.");
        }
    }
}