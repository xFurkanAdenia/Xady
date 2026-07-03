import Client from "../classes/Client";
import ConsoleCommandSender from "../models/ConsoleCommandSender";
import CommandSender from "../models/CommandSender";
import { PluginCommand } from "../command/PluginCommand";
import { CommandExecutor } from "../command/CommandExecutor";
import { TabCompleter } from "../command/TabCompleter";

export default function registerSettingsCommands(client: Client, openSettingsMenu: () => void) {
    class SettingsCommandExecutor implements CommandExecutor, TabCompleter {
        async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
            if (!(sender instanceof ConsoleCommandSender)) {
                sender.sendMessage("Bu komut sadece konsoldan kullanılabilir.");
                return true;
            }
            openSettingsMenu();
            return true;
        }

        async onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<string[]> {
            return [];
        }
    }

    const exec = new SettingsCommandExecutor();
    const cmd = new PluginCommand("ayarlar")
        .setAliases(["settings"])
        .setExecutor(exec)
        .setTabCompleter(exec);
    
    client.getCommandManager().registerCommand(cmd);
}
