import chalk from "chalk";
import UtilitiesModule from "..";
import Command from "../../../models/Command";
import CommandSender from "../../../models/CommandSender";
import ConsoleCommandSender from "../../../models/ConsoleCommandSender";
import { Bot, CommandInterface } from "../../../types";
import { send } from "node:process";

export default class TpMeCommand extends Xady.Command {
    constructor() {
        super("tpme")
    }
    execute(bot: Bot, sender: CommandSender, args: string[]): void | Promise<void> {
        if(sender instanceof ConsoleCommandSender) {
            return sender.sendMessage(chalk.redBright("Bu komutu sadece oyuncular kullanabilir!"))
        }
        const instance = UtilitiesModule.getInstance();
        const permissible = instance.getPermissible();
        console.log(sender.getName())
        if (!permissible.getPermissionManager().hasPermission(sender, "utility.tpme")) return sender.sendMessage("Yetkin yok!")
        bot.chat("/tpa " + sender.getName())
    }
}