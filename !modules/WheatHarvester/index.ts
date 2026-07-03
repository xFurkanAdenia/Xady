import { Bot } from "../../types";
import PermissibleModule from "../Permissible";
import path from "path";
export default class WheatHarvesterModule extends Xady.Module {
    private static instance: WheatHarvesterModule;
    private harvesting: boolean = false;
    #permissible!: PermissibleModule;
    onEnable() {
        WheatHarvesterModule.instance = this;
        this.#permissible = WheatHarvesterModule.getModule<PermissibleModule>("Permissible")
        // Komutları yükle
        this.getClient().getCommandManager().loadCommands(path.join(this.getExecDir(), "src", "commands"));
        console.log(Xady.prefix.xady + Xady.prefix.module, "WheatHarvester modülü yüklendi. Başlatmak için !wheat başlat yazın.");
    }
    public isHarvesting(): boolean {
        return this.harvesting;
    }
    public startHarvesting() {
        const bot = this.getClient().getBot();
        if (bot) {
            // Pathfinder plugin kontrolü
            try {
                const { pathfinder } = require('mineflayer-pathfinder');
                if (!bot.hasPlugin(pathfinder)) {
                    bot.loadPlugin(pathfinder);
                }
            } catch (err) {}
            this.harvesting = true;
            this.runHarvester(bot);
        }
    }
    public stopHarvesting() {
        this.harvesting = false;
        const bot = this.getClient().getBot();
        if (bot && bot.pathfinder) {
            bot.pathfinder.stop();
        }
    }
    private async runHarvester(bot: Bot) {
        const registry = require('prismarine-registry')(bot.version);
        const { goals, Movements } = require('mineflayer-pathfinder');
        // Hareket ayarlarını bir kez yapılandır (Agresif Mod)
        const defaultMove = new Movements(bot, registry);
        defaultMove.canDig = false;
        defaultMove.scaffoldingBlocks = [];
        defaultMove.allowSprinting = true; // Koşarak git
        defaultMove.allowParkour = true;   // Zıplayarak git
        bot.pathfinder.setMovements(defaultMove);
        while (this.harvesting) {
            try {
                // 1. Çevredeki tüm yetişmiş buğdayları bul
                const wheatBlocks = bot.findBlocks({
                    matching: (block: any) => {
                        if (!block || block.name !== 'wheat') return false;
                        return block.metadata === 7 || (block.properties && block.properties.age === 7);
                    },
                    maxDistance: 32,
                    count: 100
                });
                if (wheatBlocks.length > 0) {
                    const botPos = bot.entity.position;
                    const botYaw = bot.entity.yaw;
                    const viewVector = {
                        x: -Math.sin(botYaw),
                        z: -Math.cos(botYaw)
                    };
                    const targets = wheatBlocks
                        .map(pos => {
                            const blockPos = pos.offset(0.5, 0, 0.5);
                            const dirToBlock = {
                                x: blockPos.x - botPos.x,
                                z: blockPos.z - botPos.z
                            };
                            const dist = Math.sqrt(dirToBlock.x ** 2 + dirToBlock.z ** 2);
                            if (dist > 0) {
                                dirToBlock.x /= dist;
                                dirToBlock.z /= dist;
                            }
                            const dot = dirToBlock.x * viewVector.x + dirToBlock.z * viewVector.z;
                            return { pos, dist, dot };
                        })
                        .sort((a, b) => a.dist - b.dist);
                    // Önündeki hedefleri filtrele
                    const frontTargets = targets.filter(t => t.dot > 0.3);
                    const mainTarget = frontTargets[0] || targets[0];
                    // 2. Hareket Mantığı (Hiç Durma)
                    if (mainTarget) {
                        const goal = new goals.GoalNear(mainTarget.pos.x, mainTarget.pos.y, mainTarget.pos.z, 0);
                        // Eğer zaten bir yere gidiyorsa ve yeni hedef çok yakınsa goal güncelleme
                        if (!bot.pathfinder.isMoving() || bot.entity.position.distanceTo(mainTarget.pos) > 2) {
                            bot.pathfinder.setGoal(goal);
                        }
                    }
                    // 3. Tekli Odaklı Kırma (Nuker Değil, Oyuncu Gibi)
                    // Menzil içindeki en iyi tek bir bloğu seç ve ona odaklan
                    const harvestable = targets.find(t => t.dist <= 5 && (t.dot > 0.4 || t.dist < 1.5));
                    if (harvestable) {
                        const block = bot.blockAt(harvestable.pos);
                        if (block && block.name === 'wheat') {
                            try {
                                // Bloğa bak ve kır (Sadece bu bloğa odaklan)
                                await bot.lookAt(harvestable.pos.offset(0.5, 0.5, 0.5), true);
                                await bot.dig(block, true); 
                                // Tohum ekme
                                const seeds = bot.inventory.items().find(item => item.name === 'wheat_seeds');
                                if (seeds) {
                                    const soil = bot.blockAt(harvestable.pos.offset(0, -1, 0));
                                    if (soil && soil.name === 'farmland') {
                                        await bot.equip(seeds, 'hand');
                                        await bot.placeBlock(soil, { x: 0, y: 1, z: 0 } as any).catch(() => {});
                                    }
                                }
                            } catch (err) {}
                        }
                    }
                } else {
                    // Buğday kalmadıysa biraz gezin veya dur
                    bot.pathfinder.stop();
                }
            } catch (err) {
                console.error(Xady.prefix.xady + Xady.prefix.error, "Harvester hatası:", err);
            }
            // Döngü hızını artır (Daha seri tepki)
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    onDisable() {
        this.harvesting = false;
        console.log(Xady.prefix.xady + Xady.prefix.module, "WheatHarvester devre dışı bırakıldı.");
    }
    static getInstance(): WheatHarvesterModule {
        return WheatHarvesterModule.instance;
    }
    getPermissible(): PermissibleModule {
        return this.#permissible;
    }
}