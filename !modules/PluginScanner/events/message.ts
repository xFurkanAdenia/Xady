import PluginScannerModule from "..";

export default class MessageEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "message"
        })
    }

    execute(message: any): Promise<void> | void {
        const client = PluginScannerModule.getInstance().getClient();
        const bot = client.getBot();
        if (!bot) return;

        const msg = message.toString();

        // Plugin listesi genellikle bu formatlarda gelir
        if (msg.includes("Plugins (") || msg.includes("Eklentiler (") || msg.startsWith("Bukkit Plugins:") || msg.startsWith("Server Plugins:")) {
            console.log(Xady.prefix.xady + " §aPlugin Listesi Tespit Edildi!");
            console.log("§f" + msg);
            
            // Eğer birisi !plugins komutunu kullandıysa ona da fısıldayabiliriz (isteğe bağlı)
            // Ama şimdilik sadece konsola basması yeterli.
        }
    }
}
