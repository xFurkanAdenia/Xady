import PermissibleModule from "../Permissible";
import path from "path";
export default class UtilitiesModule extends Xady.Module {
    static #instance: UtilitiesModule;
    #permissible!: PermissibleModule;
    #botCreateListener?: () => void;
    onEnable(): void {
        UtilitiesModule.#instance = this;
        const client = this.getClient();
        this.#permissible = UtilitiesModule.getModule<PermissibleModule>("Permissible")
        const commandManager = client.getCommandManager()
        commandManager.loadCommands(path.join(this.getExecDir(), "src", "commands"))

        const load = () => {
            const bot = client.getBot();
            if (bot) {
                bot.loadEvents(path.join(this.getExecDir(), "src", "events"));
            } else console.log("Bot not found");
        };

        if (client.getBot()) {
            load();
        }
        this.#botCreateListener = load;
        client.on("botCreate", this.#botCreateListener)
        
    }
    onDisable(): void {
        if (this.#botCreateListener) {
            this.getClient().off("botCreate", this.#botCreateListener);
        }
    }

    public getPermissible() {
        return this.#permissible;
    }

    public static getInstance() {
        return this.#instance;
    }
}