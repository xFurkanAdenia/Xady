import CommandSender from "../models/CommandSender";
import { PluginCommand } from "./PluginCommand";
export interface TabCompleter {
    onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): string[] | Promise<string[]>;
}
