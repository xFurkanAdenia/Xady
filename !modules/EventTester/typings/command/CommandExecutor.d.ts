import CommandSender from "../models/CommandSender";
import { PluginCommand } from "./PluginCommand";
export interface CommandExecutor {
    onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): boolean | Promise<boolean>;
}
