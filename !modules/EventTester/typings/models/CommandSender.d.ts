import Client from "../classes/Client";
export default class CommandSender {
    #private;
    constructor(client: Client, name: string);
    getName(): string;
    sendMessage(message: string): void;
    hasPermission(permission: string): boolean;
}
