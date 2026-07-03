import DemoListener from "./events/DemoListener";
import DemoCustomEvent from "./events/DemoCustomEvent";
import DemoServiceAPI from "./services/DemoServiceAPI";
import DemoServiceImpl from "./services/DemoServiceImpl";

/**
 * Demo Modül - Tüm Xady özelliklerini gösterir
 * 
 * Özellikler:
 * ✅ Mineflayer event'lerini dinler
 * ✅ Custom event oluşturur ve tetikler
 * ✅ Servis sağlar
 * ✅ Diğer servisleri kullanır
 * ✅ Komutlar register eder
 * ✅ Config sistemi kullanır
 */
export default class DemoModuleModule extends Xady.Module {
    private demoService?: DemoServiceImpl;

    onEnable() {
        console.log("🎯 DemoModule yükleniyor...");
        
        // 1. Config sistemi
        this.setupConfig();
        
        // 2. Event sistemi
        this.setupEvents();
        
        // 3. Servis sistemi
        this.setupServices();
        
        // 4. Komut sistemi
        this.setupCommands();
        
        console.log("✅ DemoModule başarıyla yüklendi!");
        console.log("📋 Kullanılabilir komutlar: /demo, /test");
        console.log("🎮 Tüm mineflayer event'leri dinleniyor");
        console.log("🔧 DemoServiceAPI servisi sağlanıyor");
    }

    onDisable() {
        console.log("❌ DemoModule kapatıldı!");
        // Tüm event'ler, servisler ve komutlar otomatik unregister edilir
    }

    private setupConfig(): void {
        // Default config'i kaydet
        this.saveDefaultConfig();
        
        const config = this.getConfig();
        const message = config.welcome_message || "Merhaba Xady!";
        const enabled = config.features?.demo_enabled !== false;
        
        console.log(`📝 Config: ${message} (Enabled: ${enabled})`);
    }

    private setupEvents(): void {
        // Event listener'ı register et
        this.registerEvents(new DemoListener());
        console.log("🎧 Event listener'lar register edildi");
    }

    private setupServices(): void {
        // Kendi servisimizi sağla
        this.demoService = new DemoServiceImpl();
        this.registerService(DemoServiceAPI, this.demoService, Xady.ServicePriority.NORMAL);
        console.log("🔧 DemoServiceAPI servisi register edildi");
        
        // Diğer servisleri kontrol et
        this.checkOtherServices();
    }

    private checkOtherServices(): void {
        // Economy servisini kontrol et
        const hasEconomy = this.isServiceAvailable(this.getEconomyAPIClass());
        if (hasEconomy) {
            console.log("💰 Economy servisi bulundu!");
        } else {
            console.log("💸 Economy servisi bulunamadı (EconomyService modülü yüklü değil)");
        }
    }

    private setupCommands(): void {
        // Demo komutu (manifest'ten otomatik register edilir)
        // Test komutu (manuel register)
        const testCmd = new Xady.PluginCommand("testcustom", this)
            .setDescription("Custom test komutu")
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    sender.sendMessage("🧪 Custom test komutu çalıştı!");
                    
                    // Custom event tetikle
                    const event = new DemoCustomEvent(sender.getName(), "test_action");
                    this.callEvent(event);
                    
                    sender.sendMessage(`✨ Custom event tetiklendi! Result: ${event.getResult()}`);
                    return true;
                }
            });
        
        this.getClient().getCommandManager().registerCommand(testCmd);
        console.log("⚡ Komutlar register edildi");
    }

    // Manifest'ten gelen komutlar için executor
    async onCommand(sender: any, command: any, label: string, args: string[]): Promise<boolean> {
        if (label === "demo") {
            return this.handleDemoCommand(sender, args);
        } else if (label === "test") {
            return this.handleTestCommand(sender, args);
        }
        return false;
    }

    private async handleDemoCommand(sender: any, args: string[]): Promise<boolean> {
        sender.sendMessage("🎯 === Xady Demo Modülü ===");
        sender.sendMessage("");
        sender.sendMessage("📋 Özellikler:");
        sender.sendMessage("✅ 92 Mineflayer Eventi");
        sender.sendMessage("✅ Custom Event Sistemi");
        sender.sendMessage("✅ ServiceManager");
        sender.sendMessage("✅ Komut Sistemi");
        sender.sendMessage("✅ Config Sistemi");
        sender.sendMessage("");
        sender.sendMessage("🎮 Komutlar:");
        sender.sendMessage("/demo - Bu menü");
        sender.sendMessage("/test - Test komutu");
        sender.sendMessage("/testcustom - Custom event test");
        sender.sendMessage("");
        
        // Servis durumunu göster
        const serviceCount = this.getServiceCount();
        sender.sendMessage(`🔧 Aktif servis sayısı: ${serviceCount}`);
        
        return true;
    }

    private async handleTestCommand(sender: any, args: string[]): Promise<boolean> {
        sender.sendMessage("🧪 Test komutu çalıştırılıyor...");
        
        // Bot bilgilerini göster
        const bot = this.getClient().getBot();
        if (bot) {
            sender.sendMessage(`🤖 Bot: ${bot.username}`);
            sender.sendMessage(`❤️ Can: ${bot.health}`);
            sender.sendMessage(`🍖 Açlık: ${bot.food}`);
            sender.sendMessage(`📍 Pozisyon: ${bot.entity.position.x.toFixed(1)}, ${bot.entity.position.y.toFixed(1)}, ${bot.entity.position.z.toFixed(1)}`);
        }
        
        // Economy testi
        await this.testEconomyService(sender);
        
        // Demo servis testi
        if (this.demoService) {
            const result = await this.demoService.processData("test_data");
            sender.sendMessage(`🔧 Demo servis sonucu: ${result}`);
        }
        
        return true;
    }

    private async testEconomyService(sender: any): Promise<void> {
        const economy = this.getService(this.getEconomyAPIClass());
        if (economy) {
            try {
                const money = await economy.getMoney(sender.getName());
                sender.sendMessage(`💰 Paranız: ${money} coin`);
            } catch (e) {
                sender.sendMessage("💸 Economy servisi hatası");
            }
        } else {
            sender.sendMessage("💸 Economy servisi mevcut değil");
        }
    }

    private getServiceCount(): number {
        // ServiceManager'dan servis sayısını al (hack yöntemi)
        const serviceManager = this.getClient().getServiceManager();
        return (serviceManager as any).services?.size || 0;
    }

    private getEconomyAPIClass(): any {
        // Economy API class referansı (modüller arası kullanım için)
        return class EconomyAPI {
            getMoney(player: string): Promise<number> { throw new Error("Not implemented"); }
            addMoney(player: string, amount: number): Promise<boolean> { throw new Error("Not implemented"); }
            removeMoney(player: string, amount: number): Promise<boolean> { throw new Error("Not implemented"); }
            hasMoney(player: string, amount: number): Promise<boolean> { throw new Error("Not implemented"); }
        };
    }
}