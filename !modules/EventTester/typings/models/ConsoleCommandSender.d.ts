import CommandSender from "./CommandSender";
export default class ConsoleCommandSender extends CommandSender {
    sendMessage(message: string): void;
    hasPermission(permission: string): boolean;
}
