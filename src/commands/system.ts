import chalk from "chalk";
import Client from "../classes/Client";
import { PluginCommand } from "../command/PluginCommand";
import { CommandExecutor } from "../command/CommandExecutor";
import { TabCompleter } from "../command/TabCompleter";
import CommandSender from "../models/CommandSender";

export default function registerSystemCommands(client: Client) {
    class ReconnectCommandExecutor implements CommandExecutor, TabCompleter {
        async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
            sender.sendMessage(chalk.yellow("Bot sunucuya yeniden bağlanıyor..."));
            client.handleReconnect(true); // true = force manual reconnect, reset attempts
            return true;
        }
        async onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<string[]> {
            return [];
        }
    }

    class DisconnectCommandExecutor implements CommandExecutor, TabCompleter {
        async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
            const bot = client.getBot();
            if (bot) {
                sender.sendMessage(chalk.yellow("Bot sunucudan ayrılıyor..."));
                client.disconnectBot("Konsol tarafından bağlantı kesildi.");
            } else {
                sender.sendMessage(chalk.red("Bot şu anda herhangi bir sunucuya bağlı değil."));
            }
            return true;
        }
        async onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<string[]> {
            return [];
        }
    }

    class ExitCommandExecutor implements CommandExecutor, TabCompleter {
        async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
            sender.sendMessage(chalk.redBright("Xady Client kapatılıyor..."));
            client.disconnectBot("İstemci kapatılıyor.");
            
            client.getModuleManager().getModules().forEach((val) => {
                if (val.onDisable) val.onDisable();
            });
            
            setTimeout(() => {
                process.exit(0);
            }, 500);
            return true;
        }
        async onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<string[]> {
            return [];
        }
    }

    const reconnectExec = new ReconnectCommandExecutor();
    client.getCommandManager().registerCommand(
        new PluginCommand("reconnect").setExecutor(reconnectExec).setTabCompleter(reconnectExec)
    );

    const disconnectExec = new DisconnectCommandExecutor();
    client.getCommandManager().registerCommand(
        new PluginCommand("disconnect").setExecutor(disconnectExec).setTabCompleter(disconnectExec)
    );

    const exitExec = new ExitCommandExecutor();
    client.getCommandManager().registerCommand(
        new PluginCommand("exit").setAliases(["stop"]).setExecutor(exitExec).setTabCompleter(exitExec)
    );
}
