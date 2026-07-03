import DemoCustomEvent from "./DemoCustomEvent";

/**
 * Demo Event Listener - Çeşitli event'leri dinler
 */
export default class DemoListener implements Xady.Listener {
    
    // === Mineflayer Events ===
    
    @Xady.EventHandler(Xady.EventPriority.MONITOR)
    async onSpawn(event: Xady.SpawnEvent) {
        console.log("🎮 [DemoListener] Bot spawn oldu!");
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerJoin(event: Xady.PlayerJoinEvent) {
        console.log(`👋 [DemoListener] ${event.getUsername()} sunucuya katıldı!`);
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerLeft(event: Xady.PlayerLeftEvent) {
        console.log(`👋 [DemoListener] ${event.getUsername()} sunucudan ayrıldı!`);
    }
    
    @Xady.EventHandler(Xady.EventPriority.LOW)
    async onChat(event: Xady.PlayerChatEvent) {
        const username = event.getUsername();
        const message = event.getMessage();
        
        console.log(`💬 [DemoListener] ${username}: ${message}`);
        
        // Küfür filtresi örneği
        if (message.toLowerCase().includes("kötü_kelime")) {
            event.setCancelled(true);
            console.log("🚫 [DemoListener] Uygunsuz mesaj engellendi!");
        }
        
        // Özel komutlar
        if (message.startsWith("!demo")) {
            console.log("🎯 [DemoListener] Demo komut algılandı!");
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.MONITOR)
    async onMessage(event: Xady.MessageEvent) {
        const position = event.getPosition();
        const text = event.toString();
        
        // Sadece sistem mesajlarını logla
        if (position === "system") {
            console.log(`📢 [DemoListener] System: ${text}`);
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEntitySpawn(event: Xady.EntitySpawnEvent) {
        const entityType = event.getEntityType();
        const position = event.getPosition();
        
        console.log(`👾 [DemoListener] Entity spawn: ${entityType} at ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
    }
    
    @Xady.EventHandler(Xady.EventPriority.HIGH)
    async onHealth(event: Xady.HealthEvent) {
        // Client'dan bot bilgisini al (BaseModule'den erişim)
        const client = (this as any).client || (this.constructor as any).client;
        const bot = client?.getBot();
        
        if (bot && bot.health < 10) {
            console.log("⚠️ [DemoListener] UYARI: Bot'un canı düşük!");
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onMove(event: Xady.MoveEvent) {
        const position = event.getPosition();
        
        // Sadece büyük hareketleri logla (spam önlemek için)
        if (Math.abs(position.x) % 10 < 0.1) {
            console.log(`🚶 [DemoListener] Bot hareket etti: ${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}`);
        }
    }
    
    // === Custom Events ===
    
    @Xady.EventHandler(Xady.EventPriority.HIGH)
    async onDemoCustomEvent(event: DemoCustomEvent) {
        const player = event.getPlayer();
        const action = event.getAction();
        
        console.log(`✨ [DemoListener] Custom event: ${player} -> ${action}`);
        
        // Event'i işle ve sonuç ekle
        const result = `Processed: ${action} for ${player}`;
        event.setResult(result);
        
        // Özel aksiyonlar
        if (action === "test_action") {
            console.log("🧪 [DemoListener] Test aksiyonu işlendi!");
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.LOWEST)
    async onDemoCustomEventFirst(event: DemoCustomEvent) {
        console.log(`🥇 [DemoListener] Custom event (LOWEST priority) - İlk işlem`);
        
        // İlk işlemler (validation, logging, vb.)
        if (!event.getPlayer()) {
            console.log("❌ [DemoListener] Geçersiz player!");
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.MONITOR)
    async onDemoCustomEventMonitor(event: DemoCustomEvent) {
        console.log(`📊 [DemoListener] Custom event (MONITOR) - Final result: ${event.getResult()}`);
        
        // Sadece gözlem - event'i değiştirme!
        // Logging, analytics, vb. için kullan
    }
    
    // === Error Handling ===
    
    @Xady.EventHandler(Xady.EventPriority.HIGHEST)
    async onError(event: Xady.ErrorEvent) {
        const error = event.getError();
        const message = event.getMessage();
        
        console.error(`❌ [DemoListener] Bot hatası: ${message}`);
        console.error(error.stack);
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onKicked(event: Xady.KickedEvent) {
        const reason = event.getReason();
        const loggedIn = event.isLoggedIn();
        
        console.log(`🚫 [DemoListener] Bot atıldı! Sebep: ${reason} (Giriş yapmış: ${loggedIn})`);
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onEnd(event: Xady.EndEvent) {
        const reason = event.getReason();
        
        console.log(`🔌 [DemoListener] Bağlantı koptu: ${reason}`);
    }
    
    // === Utility Events ===
    
    @Xady.EventHandler(Xady.EventPriority.MONITOR)
    async onPhysicsTick(event: Xady.PhysicsTickEvent) {
        // Bu çok sık çalışır, sadece gerektiğinde kullan
        // console.log("⚙️ Physics tick"); // Spam yapar!
    }
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onExperience(event: Xady.ExperienceEvent) {
        const client = (this as any).client || (this.constructor as any).client;
        const bot = client?.getBot();
        
        if (bot) {
            console.log(`⭐ [DemoListener] Deneyim: Level ${bot.experience.level}, Progress ${bot.experience.progress.toFixed(2)}`);
        }
    }
}