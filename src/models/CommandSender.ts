import Client from "../classes/Client";

export default class CommandSender {
    #name: string;
    #client;
    constructor(client: Client, name: string) {
        this.#name = name;
        this.#client = client;
    }

    getName() {
        return this.#name;
    }

    sendMessage(message: string) {
        const bot = this.#client.getBot();
        bot?.whisper(this.#name, message);
    }

    hasPermission(permission: string): boolean {
        // İleride Permissible veya yetki sistemi ile bağlanabilir.
        return false;
    }
}