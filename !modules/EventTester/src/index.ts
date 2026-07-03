import "../typings";
import * as fs from "fs";
import * as path from "path";
import { CommandExecutor } from "../typings/command/CommandExecutor";
import { PluginCommand } from "../typings/command/PluginCommand";
import CommandSender from "../typings/models/CommandSender";
import { Listener } from "../typings/event/Listener";
import { ActionBarEvent } from "../typings/event/mineflayer/ActionBarEvent";
import { MessageStrEvent } from "../typings/event/mineflayer/MessageStrEvent";
import { UnmatchedMessageEvent } from "../typings/event/mineflayer/UnmatchedMessageEvent";
import { LoginEvent } from "../typings/event/mineflayer/LoginEvent";
import { InjectAllowedEvent } from "../typings/event/mineflayer/InjectAllowedEvent";
import { SpawnEvent } from "../typings/event/mineflayer/SpawnEvent";
import { RespawnEvent } from "../typings/event/mineflayer/RespawnEvent";
import { GameEvent } from "../typings/event/mineflayer/GameEvent";
import { TitleEvent } from "../typings/event/mineflayer/TitleEvent";
import { RainEvent } from "../typings/event/mineflayer/RainEvent";
import { KickedEvent } from "../typings/event/mineflayer/KickedEvent";
import { SpawnResetEvent } from "../typings/event/mineflayer/SpawnResetEvent";
import { DeathEvent } from "../typings/event/mineflayer/DeathEvent";
import { HealthEvent } from "../typings/event/mineflayer/HealthEvent";
import { BreathEvent } from "../typings/event/mineflayer/BreathEvent";
import { EntitySwingArmEvent } from "../typings/event/mineflayer/EntitySwingArmEvent";
import { EntityHurtEvent } from "../typings/event/mineflayer/EntityHurtEvent";
import { EntityDeadEvent } from "../typings/event/mineflayer/EntityDeadEvent";
import { EntityTamingEvent } from "../typings/event/mineflayer/EntityTamingEvent";
import { EntityTamedEvent } from "../typings/event/mineflayer/EntityTamedEvent";
import { EntityShakingOffWaterEvent } from "../typings/event/mineflayer/EntityShakingOffWaterEvent";
import { EntityEatingGrassEvent } from "../typings/event/mineflayer/EntityEatingGrassEvent";
import { EntityHandSwapEvent } from "../typings/event/mineflayer/EntityHandSwapEvent";
import { EntityEatEvent } from "../typings/event/mineflayer/EntityEatEvent";
import { EntityCriticalEffectEvent } from "../typings/event/mineflayer/EntityCriticalEffectEvent";
import { EntityMagicCriticalEffectEvent } from "../typings/event/mineflayer/EntityMagicCriticalEffectEvent";
import { EntityCrouchEvent } from "../typings/event/mineflayer/EntityCrouchEvent";
import { EntityUncrouchEvent } from "../typings/event/mineflayer/EntityUncrouchEvent";
import { EntityEquipEvent } from "../typings/event/mineflayer/EntityEquipEvent";
import { EntitySleepEvent } from "../typings/event/mineflayer/EntitySleepEvent";
import { EntitySpawnEvent } from "../typings/event/mineflayer/EntitySpawnEvent";
import { EntityElytraFlewEvent } from "../typings/event/mineflayer/EntityElytraFlewEvent";
import { UsedFireworkEvent } from "../typings/event/mineflayer/UsedFireworkEvent";
import { ItemDropEvent } from "../typings/event/mineflayer/ItemDropEvent";
import { PlayerCollectEvent } from "../typings/event/mineflayer/PlayerCollectEvent";
import { EntityAttributesEvent } from "../typings/event/mineflayer/EntityAttributesEvent";
import { EntityGoneEvent } from "../typings/event/mineflayer/EntityGoneEvent";
import { EntityMovedEvent } from "../typings/event/mineflayer/EntityMovedEvent";
import { EntityDetachEvent } from "../typings/event/mineflayer/EntityDetachEvent";
import { EntityAttachEvent } from "../typings/event/mineflayer/EntityAttachEvent";
import { EntityUpdateEvent } from "../typings/event/mineflayer/EntityUpdateEvent";
import { EntityEffectEvent } from "../typings/event/mineflayer/EntityEffectEvent";
import { EntityEffectEndEvent } from "../typings/event/mineflayer/EntityEffectEndEvent";
import { PlayerJoinEvent } from "../typings/event/mineflayer/PlayerJoinEvent";
import { PlayerUpdatedEvent } from "../typings/event/mineflayer/PlayerUpdatedEvent";
import { PlayerLeftEvent } from "../typings/event/mineflayer/PlayerLeftEvent";
import { BlockUpdateEvent } from "../typings/event/mineflayer/BlockUpdateEvent";
import { ChunkColumnLoadEvent } from "../typings/event/mineflayer/ChunkColumnLoadEvent";
import { ChunkColumnUnloadEvent } from "../typings/event/mineflayer/ChunkColumnUnloadEvent";
import { SoundEffectHeardEvent } from "../typings/event/mineflayer/SoundEffectHeardEvent";
import { HardcodedSoundEffectHeardEvent } from "../typings/event/mineflayer/HardcodedSoundEffectHeardEvent";
import { NoteHeardEvent } from "../typings/event/mineflayer/NoteHeardEvent";
import { PistonMoveEvent } from "../typings/event/mineflayer/PistonMoveEvent";
import { ChestLidMoveEvent } from "../typings/event/mineflayer/ChestLidMoveEvent";
import { BlockBreakProgressObservedEvent } from "../typings/event/mineflayer/BlockBreakProgressObservedEvent";
import { BlockBreakProgressEndEvent } from "../typings/event/mineflayer/BlockBreakProgressEndEvent";
import { DiggingCompletedEvent } from "../typings/event/mineflayer/DiggingCompletedEvent";
import { DiggingAbortedEvent } from "../typings/event/mineflayer/DiggingAbortedEvent";
import { MoveEvent } from "../typings/event/mineflayer/MoveEvent";
import { ForcedMoveEvent } from "../typings/event/mineflayer/ForcedMoveEvent";
import { MountEvent } from "../typings/event/mineflayer/MountEvent";
import { DismountEvent } from "../typings/event/mineflayer/DismountEvent";
import { WindowOpenEvent } from "../typings/event/mineflayer/WindowOpenEvent";
import { WindowCloseEvent } from "../typings/event/mineflayer/WindowCloseEvent";
import { SleepEvent } from "../typings/event/mineflayer/SleepEvent";
import { WakeEvent } from "../typings/event/mineflayer/WakeEvent";
import { ExperienceEvent } from "../typings/event/mineflayer/ExperienceEvent";
import { PhysicsTickEvent } from "../typings/event/mineflayer/PhysicsTickEvent";
import { ScoreboardDeletedEvent } from "../typings/event/mineflayer/ScoreboardDeletedEvent";
import { ScoreboardTitleChangedEvent } from "../typings/event/mineflayer/ScoreboardTitleChangedEvent";
import { ScoreUpdatedEvent } from "../typings/event/mineflayer/ScoreUpdatedEvent";
import { ScoreRemovedEvent } from "../typings/event/mineflayer/ScoreRemovedEvent";
import { ScoreboardPositionEvent } from "../typings/event/mineflayer/ScoreboardPositionEvent";
import { TeamCreatedEvent } from "../typings/event/mineflayer/TeamCreatedEvent";
import { TeamRemovedEvent } from "../typings/event/mineflayer/TeamRemovedEvent";
import { TeamUpdatedEvent } from "../typings/event/mineflayer/TeamUpdatedEvent";
import { TeamMemberAddedEvent } from "../typings/event/mineflayer/TeamMemberAddedEvent";
import { TeamMemberRemovedEvent } from "../typings/event/mineflayer/TeamMemberRemovedEvent";
import { BossBarCreatedEvent } from "../typings/event/mineflayer/BossBarCreatedEvent";
import { BossBarDeletedEvent } from "../typings/event/mineflayer/BossBarDeletedEvent";
import { BossBarUpdatedEvent } from "../typings/event/mineflayer/BossBarUpdatedEvent";
import { ResourcePackEvent } from "../typings/event/mineflayer/ResourcePackEvent";
import { ParticleEvent } from "../typings/event/mineflayer/ParticleEvent";
import { GenericMineflayerEvent } from "../typings/event/mineflayer/GenericMineflayerEvent";
import { ScoreboardCreatedEvent } from "../typings/event/mineflayer/ScoreboardCreatedEvent";
import { WhisperEvent } from "../typings/event/mineflayer/WhisperEvent";
import { PlayerChatEvent } from "../typings/event/mineflayer/PlayerChatEvent";
import { EndEvent } from "../typings/event/mineflayer/EndEvent";
import { TimeEvent } from "../typings/event/mineflayer/TimeEvent";
import { EntityWakeEvent } from "../typings/event/mineflayer/EntityWakeEvent";

// Tüm test edilecek eventler
const ALL_EVENTS = [
    'PlayerChatEvent', 'MessageEvent', 'WhisperEvent', 'ActionBarEvent', 'MessageStrEvent', 
    'UnmatchedMessageEvent', 'InjectAllowedEvent', 'LoginEvent', 'SpawnEvent', 'RespawnEvent',
    'GameEvent', 'TitleEvent', 'RainEvent', 'TimeEvent', 'KickedEvent', 'EndEvent',
    'SpawnResetEvent', 'DeathEvent', 'HealthEvent', 'BreathEvent', 'EntitySwingArmEvent',
    'EntityHurtEvent', 'EntityDeadEvent', 'EntityTamingEvent', 'EntityTamedEvent',
    'EntityShakingOffWaterEvent', 'EntityEatingGrassEvent', 'EntityHandSwapEvent',
    'EntityWakeEvent', 'EntityEatEvent', 'EntityCriticalEffectEvent', 'EntityMagicCriticalEffectEvent',
    'EntityCrouchEvent', 'EntityUncrouchEvent', 'EntityEquipEvent', 'EntitySleepEvent',
    'EntitySpawnEvent', 'EntityElytraFlewEvent', 'UsedFireworkEvent', 'ItemDropEvent',
    'PlayerCollectEvent', 'EntityAttributesEvent', 'EntityGoneEvent', 'EntityMovedEvent',
    'EntityDetachEvent', 'EntityAttachEvent', 'EntityUpdateEvent', 'EntityEffectEvent',
    'EntityEffectEndEvent', 'PlayerJoinEvent', 'PlayerUpdatedEvent', 'PlayerLeftEvent',
    'BlockUpdateEvent', 'ChunkColumnLoadEvent', 'ChunkColumnUnloadEvent', 'SoundEffectHeardEvent',
    'HardcodedSoundEffectHeardEvent', 'NoteHeardEvent', 'PistonMoveEvent', 'ChestLidMoveEvent',
    'BlockBreakProgressObservedEvent', 'BlockBreakProgressEndEvent', 'DiggingCompletedEvent',
    'DiggingAbortedEvent', 'MoveEvent', 'ForcedMoveEvent', 'MountEvent', 'DismountEvent',
    'WindowOpenEvent', 'WindowCloseEvent', 'SleepEvent', 'WakeEvent', 'ExperienceEvent',
    'PhysicsTickEvent', 'ScoreboardCreatedEvent', 'ScoreboardDeletedEvent', 'ScoreboardTitleChangedEvent',
    'ScoreUpdatedEvent', 'ScoreRemovedEvent', 'ScoreboardPositionEvent', 'TeamCreatedEvent',
    'TeamRemovedEvent', 'TeamUpdatedEvent', 'TeamMemberAddedEvent', 'TeamMemberRemovedEvent',
    'BossBarCreatedEvent', 'BossBarDeletedEvent', 'BossBarUpdatedEvent', 'ResourcePackEvent',
    'ParticleEvent', 'ErrorEvent', 'GenericMineflayerEvent'
];

export default class EventTesterModule extends Xady.Module {
    private static instance: EventTesterModule;
    private testResults: Map<string, boolean> = new Map();
    private isTestRunning = false;
    private testStartTime = 0;
    
    onEnable() {
        EventTesterModule.instance = this;
        console.log("EventTester modülü etkinleştirildi!");
        
        // Event listener'ı kaydet
        this.registerEvents(new AllEventsListener());
        
        // Spigot API pattern: module.yml'den komutları al ve executor ata
        const testCmd = this.getCommand("testevent");
        if (testCmd) {
            testCmd.setExecutor(new TestEventCommandExecutor());
            console.log("EventTester hazır! Kullanım: !testevent");
        } else {
            console.error("❌ testevent komutu module.yml'de bulunamadı!");
        }
    }

    onDisable() {
        console.log("EventTester modülü devre dışı bırakıldı!");
    }
    
    static getInstance(): EventTesterModule {
        return EventTesterModule.instance;
    }
    
    startTest() {
        this.isTestRunning = true;
        this.testStartTime = Date.now();
        this.testResults.clear();
        
        // Tüm eventleri başlangıçta false yap
        ALL_EVENTS.forEach(event => this.testResults.set(event, false));
        
        console.log("🧪 Event testi başlatıldı! Otomatik tetikleme başlıyor...");
        
        // Otomatik tetikleme işlemlerini başlat
        this.triggerEvents();
    }
    
    private async triggerEvents() {
        const bot = this.getClient().getBot();
        if (!bot) {
            console.log("❌ Bot bulunamadı!");
            return;
        }
        
        console.log("🤖 Bot ile event'ler tetikleniyor...");
        
        try {
            // Her aktiviteyi try-catch ile çevreliyoruz
            
            // 1. Chat mesajı yaz (PlayerChatEvent, MessageEvent)
            try {
                await this.delay(1000);
                bot.chat("Event test mesajı");
                console.log("💬 Chat mesajı gönderildi");
            } catch (e) {
                console.log("💬 Chat hatası:", (e as Error).message);
            }
            
            // 2. Hareket et (MoveEvent, PhysicsTickEvent)
            try {
                await this.delay(1000);
                bot.setControlState('forward', true);
                await this.delay(1000);
                bot.setControlState('forward', false);
                console.log("🚶 İleri hareket edildi");
            } catch (e) {
                console.log("🚶 Hareket hatası:", (e as Error).message);
            }
            
            // 3. Zıpla (MoveEvent)
            try {
                await this.delay(500);
                bot.setControlState('jump', true);
                await this.delay(200);
                bot.setControlState('jump', false);
                console.log("🦘 Zıplandı");
            } catch (e) {
                console.log("🦘 Zıplama hatası:", (e as Error).message);
            }
            
            // 4. Sağa sola dön (EntityMovedEvent için)
            try {
                await this.delay(500);
                await bot.look(bot.entity.yaw + 0.5, bot.entity.pitch, true);
                await this.delay(300);
                await bot.look(bot.entity.yaw - 0.5, bot.entity.pitch, true);
                console.log("👀 Bakış açısı değiştirildi");
            } catch (e) {
                console.log("👀 Bakış hatası:", (e as Error).message);
            }
            
            // 5. Sneak yap (EntityCrouchEvent)
            try {
                await this.delay(500);
                bot.setControlState('sneak', true);
                console.log("🐱 Sneak aktif");
                await this.delay(500);
                bot.setControlState('sneak', false);
                console.log("🐱 Sneak pasif");
            } catch (e) {
                console.log("🐱 Sneak hatası:", (e as Error).message);
            }
            
            // 6. Sprint yap
            try {
                await this.delay(500);
                bot.setControlState('sprint', true);
                bot.setControlState('forward', true);
                await this.delay(1000);
                bot.setControlState('sprint', false);
                bot.setControlState('forward', false);
                console.log("🏃 Sprint yapıldı");
            } catch (e) {
                console.log("🏃 Sprint hatası:", (e as Error).message);
            }
            
            // 7. Etrafa bak (EntityUpdateEvent için)
            try {
                await this.delay(500);
                for (let i = 0; i < 4; i++) {
                    await bot.look(bot.entity.yaw + Math.PI / 2, bot.entity.pitch, false);
                    await this.delay(300);
                }
                console.log("🔄 360 derece dönüldü");
            } catch (e) {
                console.log("🔄 Dönüş hatası:", (e as Error).message);
            }
            
            // 8. Çevredeki entity'leri kontrol et
            try {
                await this.delay(500);
                const entities = Object.values(bot.entities).filter(e => e.type === 'player' || e.type === 'mob');
                console.log(`👥 ${entities.length} entity tespit edildi`);
            } catch (e) {
                console.log("👥 Entity tarama hatası:", (e as Error).message);
            }
            
            // 9. Yakındaki bloku kontrol et
            try {
                await this.delay(500);
                const pos = bot.entity.position;
                const block = bot.blockAt(pos.offset(0, -1, 0));
                if (block) {
                    console.log(`🧱 Blok tespit edildi: ${block.name}`);
                }
            } catch (e) {
                console.log("🧱 Blok tespit hatası:", (e as Error).message);
            }
            
            // 10. Back kontrolü
            try {
                await this.delay(500);
                bot.setControlState('back', true);
                await this.delay(500);
                bot.setControlState('back', false);
                console.log("🔙 Geri hareket edildi");
            } catch (e) {
                console.log("🔙 Geri hareket hatası:", (e as Error).message);
            }
            
            // 11. Sağ/Sol hareket
            try {
                await this.delay(500);
                bot.setControlState('right', true);
                await this.delay(500);
                bot.setControlState('right', false);
                await this.delay(300);
                bot.setControlState('left', true);
                await this.delay(500);
                bot.setControlState('left', false);
                console.log("↔️ Yanlara hareket edildi");
            } catch (e) {
                console.log("↔️ Yan hareket hatası:", (e as Error).message);
            }
            
            // 12. Yukarı/Aşağı bak
            try {
                await this.delay(500);
                await bot.look(bot.entity.yaw, -Math.PI / 4, false);
                await this.delay(300);
                await bot.look(bot.entity.yaw, Math.PI / 4, false);
                await this.delay(300);
                await bot.look(bot.entity.yaw, 0, false);
                console.log("⬆️⬇️ Yukarı/aşağı bakıldı");
            } catch (e) {
                console.log("⬆️⬇️ Dikey bakış hatası:", (e as Error).message);
            }
            
            // 13. Birkaç saniye bekle (PhysicsTickEvent, TimeEvent için)
            console.log("⏰ Arka planda event'ler dinleniyor...");
            await this.delay(5000);
            
            console.log("✅ Tüm tetikleme işlemleri tamamlandı!");
            console.log("⏳ Geriye kalan sürede arka planda event'ler dinleniyor...");
            
        } catch (error) {
            console.log("⚠️ Genel event tetikleme hatası:", error);
        }
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    markEventTriggered(eventName: string) {
        if (this.isTestRunning) {
            this.testResults.set(eventName, true);
        }
    }
    
    async finishTest(sender: CommandSender) {
        if (!this.isTestRunning) return;
        
        this.isTestRunning = false;
        const duration = ((Date.now() - this.testStartTime) / 1000).toFixed(2);
        
        // Test klasörünü oluştur
        const testsDir = path.join(this.getDataFolder(), "Tests");
        if (!fs.existsSync(testsDir)) {
            fs.mkdirSync(testsDir, { recursive: true });
        }
        
        // Dosya adını oluştur
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const fileName = `test_${day}_${month}_${year}_${hour}_${minute}.txt`;
        const filePath = path.join(testsDir, fileName);
        
        // Sonuçları hazırla
        let report = `╔════════════════════════════════════════════════════╗\n`;
        report += `║        XADY EVENT TESTER - TEST RAPORU            ║\n`;
        report += `╚════════════════════════════════════════════════════╝\n\n`;
        report += `📅 Tarih: ${now.toLocaleString('tr-TR')}\n`;
        report += `⏱️  Süre: ${duration} saniye\n\n`;
        report += `════════════════════════════════════════════════════\n\n`;
        
        let triggeredCount = 0;
        let notTriggeredCount = 0;
        
        // Tetiklenen eventler
        report += `✅ TETİKLENEN EVENTLER:\n`;
        report += `${'─'.repeat(50)}\n`;
        ALL_EVENTS.forEach(event => {
            if (this.testResults.get(event)) {
                report += `  ✓ ${event}\n`;
                triggeredCount++;
            }
        });
        
        report += `\n❌ TETİKLENMEYEN EVENTLER:\n`;
        report += `${'─'.repeat(50)}\n`;
        ALL_EVENTS.forEach(event => {
            if (!this.testResults.get(event)) {
                report += `  ✗ ${event}\n`;
                notTriggeredCount++;
            }
        });
        
        // İstatistikler
        const percentage = ((triggeredCount / ALL_EVENTS.length) * 100).toFixed(2);
        report += `\n════════════════════════════════════════════════════\n`;
        report += `📊 İSTATİSTİKLER:\n`;
        report += `${'─'.repeat(50)}\n`;
        report += `  Toplam Event: ${ALL_EVENTS.length}\n`;
        report += `  Tetiklenen: ${triggeredCount}\n`;
        report += `  Tetiklenmeyen: ${notTriggeredCount}\n`;
        report += `  Başarı Oranı: ${percentage}%\n`;
        report += `════════════════════════════════════════════════════\n`;
        
        // Dosyaya yaz
        fs.writeFileSync(filePath, report, 'utf-8');
        
        // Sonuçları gönder
        sender.sendMessage(`§a✅ Test tamamlandı!`);
        sender.sendMessage(`§e⏱️  Süre: ${duration} saniye`);
        sender.sendMessage(`§b📊 Tetiklenen: §a${triggeredCount}§b / §c${notTriggeredCount} §bTetiklenmeyen`);
        sender.sendMessage(`§6📈 Başarı Oranı: §e${percentage}%`);
        sender.sendMessage(`§d📁 Rapor: Tests/${fileName}`);
        
        console.log(`\n🎉 Test raporu oluşturuldu: ${filePath}`);
    }
    
    isRunning(): boolean {
        return this.isTestRunning;
    }
}

class TestEventCommandExecutor implements CommandExecutor {
    async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
        const module = EventTesterModule.getInstance();
        
        if (module.isRunning()) {
            sender.sendMessage("§c⚠️ Test zaten çalışıyor! Lütfen bekleyin...");
            return true;
        }
        
        sender.sendMessage("§a🧪 Event testi başlatıldı!");
        sender.sendMessage("§e⏱️  30 saniye boyunca otomatik test yapılacak...");
        sender.sendMessage("§7Bot şunları yapacak:");
        sender.sendMessage("§7  • Hareket edecek");
        sender.sendMessage("§7  • Chat yazacak");
        sender.sendMessage("§7  • Zıplayacak ve sprint yapacak");
        sender.sendMessage("§7  • Inventory açıp kapatacak");
        sender.sendMessage("§7  • Çevreyi tarayacak");
        sender.sendMessage("§b⏳ Lütfen 30 saniye bekleyin...");
        
        module.startTest();
        
        // 30 saniye bekle
        setTimeout(() => {
            module.finishTest(sender);
        }, 30000);
        
        return true;
    }
}

class AllEventsListener implements Listener {
    private markEvent(eventName: string) {
        const module = EventTesterModule.getInstance();
        if (module) {
            module.markEventTriggered(eventName);
            
            // Sadece test çalışırken log at
            if (module.isRunning()) {
                console.log(`✅ [TEST] ${eventName} tetiklendi!`);
            }
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onMessage(event: MessageEvent) {
        this.markEvent('MessageEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerChat(event: PlayerChatEvent) {
        this.markEvent('PlayerChatEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onWhisper(event: WhisperEvent) {
        this.markEvent('WhisperEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onActionBar(event: ActionBarEvent) {
        this.markEvent('ActionBarEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onMessageStr(event: MessageStrEvent) {
        this.markEvent('MessageStrEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onUnmatchedMessage(event: UnmatchedMessageEvent) {
        this.markEvent('UnmatchedMessageEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onInjectAllowed(event: InjectAllowedEvent) {
        this.markEvent('InjectAllowedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onLogin(event: LoginEvent) {
        this.markEvent('LoginEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onSpawn(event: SpawnEvent) {
        this.markEvent('SpawnEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onRespawn(event: RespawnEvent) {
        this.markEvent('RespawnEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onGame(event: GameEvent) {
        this.markEvent('GameEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTitle(event: TitleEvent) {
        this.markEvent('TitleEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onRain(event: RainEvent) {
        this.markEvent('RainEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTime(event: TimeEvent) {
        this.markEvent('TimeEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onKicked(event: KickedEvent) {
        this.markEvent('KickedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEnd(event: EndEvent) {
        this.markEvent('EndEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onSpawnReset(event: SpawnResetEvent) {
        this.markEvent('SpawnResetEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onDeath(event: DeathEvent) {
        this.markEvent('DeathEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onHealth(event: HealthEvent) {
        this.markEvent('HealthEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBreath(event: BreathEvent) {
        this.markEvent('BreathEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntitySwingArm(event: EntitySwingArmEvent) {
        this.markEvent('EntitySwingArmEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityHurt(event: EntityHurtEvent) {
        this.markEvent('EntityHurtEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityDead(event: EntityDeadEvent) {
        this.markEvent('EntityDeadEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityTaming(event: EntityTamingEvent) {
        this.markEvent('EntityTamingEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityTamed(event: EntityTamedEvent) {
        this.markEvent('EntityTamedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityShakingOffWater(event: EntityShakingOffWaterEvent) {
        this.markEvent('EntityShakingOffWaterEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityEatingGrass(event: EntityEatingGrassEvent) {
        this.markEvent('EntityEatingGrassEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityHandSwap(event: EntityHandSwapEvent) {
        this.markEvent('EntityHandSwapEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityWake(event: EntityWakeEvent) {
        this.markEvent('EntityWakeEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityEat(event: EntityEatEvent) {
        this.markEvent('EntityEatEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityCriticalEffect(event: EntityCriticalEffectEvent) {
        this.markEvent('EntityCriticalEffectEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityMagicCriticalEffect(event: EntityMagicCriticalEffectEvent) {
        this.markEvent('EntityMagicCriticalEffectEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityCrouch(event: EntityCrouchEvent) {
        this.markEvent('EntityCrouchEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityUncrouch(event: EntityUncrouchEvent) {
        this.markEvent('EntityUncrouchEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityEquip(event: EntityEquipEvent) {
        this.markEvent('EntityEquipEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntitySleep(event: EntitySleepEvent) {
        this.markEvent('EntitySleepEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntitySpawn(event: EntitySpawnEvent) {
        this.markEvent('EntitySpawnEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityElytraFlew(event: EntityElytraFlewEvent) {
        this.markEvent('EntityElytraFlewEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onUsedFirework(event: UsedFireworkEvent) {
        this.markEvent('UsedFireworkEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onItemDrop(event: ItemDropEvent) {
        this.markEvent('ItemDropEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerCollect(event: PlayerCollectEvent) {
        this.markEvent('PlayerCollectEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityAttributes(event: EntityAttributesEvent) {
        this.markEvent('EntityAttributesEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityGone(event: EntityGoneEvent) {
        this.markEvent('EntityGoneEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityMoved(event: EntityMovedEvent) {
        this.markEvent('EntityMovedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityDetach(event: EntityDetachEvent) {
        this.markEvent('EntityDetachEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityAttach(event: EntityAttachEvent) {
        this.markEvent('EntityAttachEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityUpdate(event: EntityUpdateEvent) {
        this.markEvent('EntityUpdateEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityEffect(event: EntityEffectEvent) {
        this.markEvent('EntityEffectEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntityEffectEnd(event: EntityEffectEndEvent) {
        this.markEvent('EntityEffectEndEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerJoin(event: PlayerJoinEvent) {
        this.markEvent('PlayerJoinEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerUpdated(event: PlayerUpdatedEvent) {
        this.markEvent('PlayerUpdatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerLeft(event: PlayerLeftEvent) {
        this.markEvent('PlayerLeftEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBlockUpdate(event: BlockUpdateEvent) {
        this.markEvent('BlockUpdateEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onChunkColumnLoad(event: ChunkColumnLoadEvent) {
        this.markEvent('ChunkColumnLoadEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onChunkColumnUnload(event: ChunkColumnUnloadEvent) {
        this.markEvent('ChunkColumnUnloadEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onSoundEffectHeard(event: SoundEffectHeardEvent) {
        this.markEvent('SoundEffectHeardEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onHardcodedSoundEffectHeard(event: HardcodedSoundEffectHeardEvent) {
        this.markEvent('HardcodedSoundEffectHeardEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onNoteHeard(event: NoteHeardEvent) {
        this.markEvent('NoteHeardEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPistonMove(event: PistonMoveEvent) {
        this.markEvent('PistonMoveEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onChestLidMove(event: ChestLidMoveEvent) {
        this.markEvent('ChestLidMoveEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBlockBreakProgressObserved(event: BlockBreakProgressObservedEvent) {
        this.markEvent('BlockBreakProgressObservedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBlockBreakProgressEnd(event: BlockBreakProgressEndEvent) {
        this.markEvent('BlockBreakProgressEndEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onDiggingCompleted(event: DiggingCompletedEvent) {
        this.markEvent('DiggingCompletedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onDiggingAborted(event: DiggingAbortedEvent) {
        this.markEvent('DiggingAbortedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onMove(event: MoveEvent) {
        this.markEvent('MoveEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onForcedMove(event: ForcedMoveEvent) {
        this.markEvent('ForcedMoveEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onMount(event: MountEvent) {
        this.markEvent('MountEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onDismount(event: DismountEvent) {
        this.markEvent('DismountEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onWindowOpen(event: WindowOpenEvent) {
        this.markEvent('WindowOpenEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onWindowClose(event: WindowCloseEvent) {
        this.markEvent('WindowCloseEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onSleep(event: SleepEvent) {
        this.markEvent('SleepEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onWake(event: WakeEvent) {
        this.markEvent('WakeEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onExperience(event: ExperienceEvent) {
        this.markEvent('ExperienceEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPhysicsTick(event: PhysicsTickEvent) {
        this.markEvent('PhysicsTickEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreboardCreated(event: ScoreboardCreatedEvent) {
        this.markEvent('ScoreboardCreatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreboardDeleted(event: ScoreboardDeletedEvent) {
        this.markEvent('ScoreboardDeletedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreboardTitleChanged(event: ScoreboardTitleChangedEvent) {
        this.markEvent('ScoreboardTitleChangedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreUpdated(event: ScoreUpdatedEvent) {
        this.markEvent('ScoreUpdatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreRemoved(event: ScoreRemovedEvent) {
        this.markEvent('ScoreRemovedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onScoreboardPosition(event: ScoreboardPositionEvent) {
        this.markEvent('ScoreboardPositionEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTeamCreated(event: TeamCreatedEvent) {
        this.markEvent('TeamCreatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTeamRemoved(event: TeamRemovedEvent) {
        this.markEvent('TeamRemovedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTeamUpdated(event: TeamUpdatedEvent) {
        this.markEvent('TeamUpdatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTeamMemberAdded(event: TeamMemberAddedEvent) {
        this.markEvent('TeamMemberAddedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onTeamMemberRemoved(event: TeamMemberRemovedEvent) {
        this.markEvent('TeamMemberRemovedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBossBarCreated(event: BossBarCreatedEvent) {
        this.markEvent('BossBarCreatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBossBarDeleted(event: BossBarDeletedEvent) {
        this.markEvent('BossBarDeletedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onBossBarUpdated(event: BossBarUpdatedEvent) {
        this.markEvent('BossBarUpdatedEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onResourcePack(event: ResourcePackEvent) {
        this.markEvent('ResourcePackEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onParticle(event: ParticleEvent) {
        this.markEvent('ParticleEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onError(event: ErrorEvent) {
        this.markEvent('ErrorEvent');
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onGeneric(event: GenericMineflayerEvent) {
        this.markEvent('GenericMineflayerEvent');
    }
}

