import { PluginCommand } from "../command/PluginCommand";
import Client from "./Client";
import CommandSender from "../models/CommandSender";
export default class CommandManager {
    private commands;
    private client;
    constructor(client: Client);
    loadCommands: (dir: string) => any[];
    registerCommand(command: PluginCommand): void;
    getCommand(name: string): PluginCommand | undefined;
    getCommands(): Map<string, PluginCommand>;
    unregisterAll(module: any): void;
    executeCommand(sender: CommandSender, rawCommand: string): Promise<void>;
}
