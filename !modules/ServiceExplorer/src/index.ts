export default class ServiceExplorerModule extends Xady.Module {
    onEnable() {
        const servicesCmd = new Xady.PluginCommand("services", this)
            .setDescription("Kayıtlı servisleri listeler")
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    // ServiceManager'dan servisleri listele
                    this.getClient().getServiceManager().listServices();
                    sender.sendMessage("📋 Servis listesi konsola yazdırıldı.");
                    return true;
                }
            });
        
        this.getClient().getCommandManager().registerCommand(servicesCmd);
        
        console.log("🔍 ServiceExplorer modülü yüklendi!");
        console.log("Kullanım: /services - Kayıtlı servisleri listeler");
    }

    onDisable() {
        console.log("🔍 ServiceExplorer modülü kapatıldı!");
    }
}