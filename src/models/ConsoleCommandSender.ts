import CommandSender from "./CommandSender";

export default class ConsoleCommandSender extends CommandSender {
    sendMessage(message: string): void {
        console.log(message);
    }

    hasPermission(permission: string): boolean {
        return true; // Konsol her zaman her yetkiye sahiptir.
    }
}