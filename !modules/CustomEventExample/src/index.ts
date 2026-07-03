import PlayerRewardEvent from "./events/PlayerRewardEvent";
import PlayerRewardListener from "./events/PlayerRewardListener";

export default class CustomEventExampleModule extends Xady.Module {
    onEnable() {
        // Custom event listener'ını register et
        this.registerEvents(new PlayerRewardListener());
        
        // Test komutu ekle
        const cmd = new Xady.PluginCommand("reward", this)
            .setDescription("Test custom event")
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    const playerName = args[0] || "TestPlayer";
                    const amount = parseInt(args[1]) || 100;
                    const type = args[2] || "coin";
                    
                    // Custom event oluştur ve tetikle
                    const event = new PlayerRewardEvent(playerName, amount, type);
                    this.callEvent(event);
                    
                    sender.sendMessage(`Event tetiklendi! Final ödül: ${event.getRewardAmount()}`);
                    return true;
                }
            });
        
        this.getClient().getCommandManager().registerCommand(cmd);
        
        console.log("CustomEventExample modülü yüklendi!");
        console.log("Kullanım: /reward <oyuncu> <miktar> <tip>");
    }

    onDisable() {
        console.log("CustomEventExample modülü kapatıldı!");
        // Event'ler ve komutlar otomatik olarak unregister edilir
    }
}
