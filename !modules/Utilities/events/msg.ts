import UtilitiesModule from "..";
import CommandSender from "../../../models/CommandSender";

export default class MsgEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "msg",
            pattern: /\[(.*) -> ben\] (.*)/i,
            patternOptions: {
                repeat: true,
                parse: true
            }
        })
    }

    execute(matches: any): Promise<void> | void {
        if (!Array.isArray(matches)) return;

        const client = UtilitiesModule.getInstance().getClient();
        const username: string = matches[0][0];
        const message: string = matches[0][1];
        const bot = client.getBot();


        console.log("Kullanıcı Adı: " + username + " Mesaj: " + message)

        // Eğer gönderen "ben" ise (botun kendi mesajı) işleme
        if (username.toLowerCase().search(new RegExp(`^${bot?.username}|ben$`, "i")) != -1) return;


        // Komut kontrolü
        if (message.startsWith("!")) {
            const msgParts = message.split(" ");
            const cmdName = msgParts[0].substring(1).toLowerCase();
            const cmdArgs = msgParts.slice(1);
            const command = client.getCommandManager().getCommand(cmdName);

            if (!command) {
                bot?.whisper(username, `!${cmdName} adında bir komut bulunamadı!`);
                return;
            }
            command.execute(new CommandSender(client, username), cmdName, cmdArgs);
        } else {
            // Normal mesajsa sadece logla veya başka bir işlem yap
            // bot?.whisper(usename, "Mesajını aldım: " + message);
        }
    }
} 