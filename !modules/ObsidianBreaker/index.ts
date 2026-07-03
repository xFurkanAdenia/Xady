import { Bot } from "../../types";
import path from "path";
export default class ObsidianBreakerModule extends Xady.Module {
    private static instance: ObsidianBreakerModule;
    private breaking: boolean = false;
    onEnable() {
        ObsidianBreakerModule.instance = this;
        // Komutları yükle
        this.getClient().getCommandManager().loadCommands(path.join(this.getExecDir(), "src", "commands"));
        console.log(Xady.prefix.xady + Xady.prefix.module, "ObsidianBreaker modülü yüklendi. Başlatmak için !obsidian başlat yazın.");
    }
    public isBreaking(): boolean {
        return this.breaking;
    }
    public startBreaking() {
        const bot = this.getClient().getBot();
        if (bot) {
            // Plugin kontrolü ve yükleme
            try {
                const { pathfinder } = require('mineflayer-pathfinder');
                if (!bot.hasPlugin(pathfinder)) {
                    bot.loadPlugin(pathfinder);
                }
            } catch (err) {}
            this.mineObsidian(bot);
        }
    }
    public stopBreaking() {
        this.breaking = false;
        const bot = this.getClient().getBot();
        if (bot && bot.pathfinder) {
            bot.pathfinder.stop();
        }
    }
    private async mineObsidian(bot: Bot) {
        if (this.breaking) return;
        this.breaking = true;
        const registry = require('prismarine-registry')(bot.version);
        const { goals, Movements } = require('mineflayer-pathfinder');
        while (this.breaking) {
            try {
                // Obsidyen bloğu ara (64 blok mesafe, altındakini kırmayacak şekilde)
                const obsidian = bot.findBlock({
                    matching: (block: any) => {
                        if (!block || block.type !== registry.blocksByName.obsidian.id) return false;
                        if (!bot.entity || !bot.entity.position || !block.position) return true;
                        const botPos = bot.entity.position;
                        const bx = Math.floor(botPos.x);
                        const by = Math.floor(botPos.y);
                        const bz = Math.floor(botPos.z);
                        // KESİN KURAL: Botun tam olarak üzerinde durduğu (X ve Z koordinatlarının çakıştığı)
                        // ve ayak seviyesinin altındaki bloğu ASLA kırma.
                        if (block.position.x === bx && block.position.z === bz && block.position.y < by) {
                            return false;
                        }
                        // Botun içinde bulunduğu bloğu da koru
                        if (block.position.x === bx && block.position.z === bz && block.position.y === by) {
                            return false;
                        }
                        return true;
                    },
                    maxDistance: 64
                });
                if (obsidian) {
                    const distance = bot.entity.position.distanceTo(obsidian.position);
                    // Hareket ayarlarını yapılandır
                    const defaultMove = new Movements(bot, registry);
                    defaultMove.canDig = false;
                    bot.pathfinder.setMovements(defaultMove);
                    // Obsidyene çok yakın dur (içinde kalması için mesafe 1)
                    if (distance > 1.5) {
                        console.log(Xady.prefix.xady + Xady.prefix.module, `Obsidyene gidiliyor: ${obsidian.position}`);
                        try {
                            const goal = new goals.GoalNear(obsidian.position.x, obsidian.position.y, obsidian.position.z, 1);
                            await bot.pathfinder.goto(goal);
                        } catch (err) {
                            console.log(Xady.prefix.xady + Xady.prefix.error, `Yol bulunamadı.`);
                        }
                    }
                    // Bloğa bak
                    await bot.lookAt(obsidian.position.offset(0.5, 0.5, 0.5));
                    // Kırma hazırlığı
                    const tool = bot.inventory.items().find((item: any) => item.name.includes('pickaxe'));
                    if (tool) {
                        await bot.equip(tool, 'hand');
                    }
                    // Bloğu kır
                    try {
                        await bot.dig(obsidian, true);
                        console.log(Xady.prefix.xady + Xady.prefix.module, `Obsidyen kırıldı, 1 blok ilerleniyor...`);
                        // Kırdıktan sonra 1 blok ilerle (kırılan bloğun yerine git)
                        const forwardGoal = new goals.GoalBlock(obsidian.position.x, obsidian.position.y, obsidian.position.z);
                        await bot.pathfinder.goto(forwardGoal);
                    } catch (err) {
                        console.log(Xady.prefix.xady + Xady.prefix.error, `Kırma veya ilerleme hatası.`);
                    }
                }
            } catch (err) {
                console.error(Xady.prefix.xady + Xady.prefix.error, "Bir hata oluştu:", err);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    onDisable() {
        this.breaking = false;
        console.log(Xady.prefix.xady + Xady.prefix.module, "ObsidianBreaker devre dışı bırakıldı.");
    }
    static getInstance(): ObsidianBreakerModule {
        return ObsidianBreakerModule.instance;
    }
}