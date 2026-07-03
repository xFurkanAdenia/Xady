import path from "path";

export default class PluginScannerModule extends Xady.Module {
    static #instance: PluginScannerModule;

    #botCreateListener?: () => void;
    onEnable(): void {
        PluginScannerModule.#instance = this;
        const client = this.getClient();
        const commandManager = client.getCommandManager();
        
        // Komutları yükle
        commandManager.loadCommands(path.join(this.getExecDir(), "src", "commands"));

        const load = () => {
            const bot = client.getBot();
            if (bot) {
                // Eventleri yükle
                bot.loadEvents(path.join(this.getExecDir(), "src", "events"));
            }
        };

        if (client.getBot()) {
            load();
        }
        this.#botCreateListener = load;
        client.on("botCreate", this.#botCreateListener);
    }

    onDisable(): void {
        if (this.#botCreateListener) {
            this.getClient().off("botCreate", this.#botCreateListener);
        }
    }

    public static getInstance() {
        return this.#instance;
    }
}
