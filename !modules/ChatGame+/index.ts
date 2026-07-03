import path from "path";

export interface IGameData {
    username: string,
    reward: number
    text: string
}

class GameData implements IGameData {
    username: string;
    reward: number;
    text: string;
    constructor(username: string, reward: number, text: string) {
        this.username = username;
        this.reward = reward;
        this.text = text;
    }
}


export default class ChatGamePlusModule extends Xady.Module {
    static #instance: ChatGamePlusModule;
    public gameData?: GameData;
    #botCreateListener?: () => void;
    onEnable() {
        ChatGamePlusModule.#instance = this;
        const client = this.getClient();
        const load = () => {
            const bot = client.getBot();
            bot?.loadEvents(path.join(this.getExecDir(), "src", "events"))
        };
        if (client.getBot()) {
            load();
        }
        this.#botCreateListener = load;
        client.on("botCreate", this.#botCreateListener);
        const cmd = new Xady.PluginCommand("chatgame", this)
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    const bot = client.getBot();
                    if(!bot) return true;
                    if(!(sender instanceof Xady.ConsoleCommandSender)) return true;
                    this.gameData = new GameData(sender.getName(), 2000, "Merhaba!");
                    bot.chat("İlk " + this.gameData.text + " yazana " + this.gameData.reward + " para verilecektir.");
                    return true;
                }
            });
        this.getClient().getCommandManager().registerCommand(cmd);
    }

    public static getInstance() {
        return ChatGamePlusModule.#instance;
    }

    onDisable() {
        if (this.#botCreateListener) {
            this.getClient().off("botCreate", this.#botCreateListener);
        }
    }
}