import PlayerRewardEvent from "./PlayerRewardEvent";

/**
 * Custom Event Listener
 * Diğer modüller bu event'i dinleyebilir
 */
export default class PlayerRewardListener implements Xady.Listener {
    
    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    async onPlayerReward(event: PlayerRewardEvent) {
        const player = event.getPlayerName();
        const amount = event.getRewardAmount();
        const type = event.getRewardType();
        
        console.log(`🎁 ${player} ${amount} ${type} ödülü aldı!`);
        
        // Ödülü 2 katına çıkar (örnek)
        if (type === "coin") {
            event.setRewardAmount(amount * 2);
            console.log(`💰 Ödül 2 katına çıkarıldı: ${event.getRewardAmount()}`);
        }
    }
    
    @Xady.EventHandler(Xady.EventPriority.HIGH)
    async onPlayerRewardHigh(event: PlayerRewardEvent) {
        // Yüksek öncelikli handler
        console.log(`⭐ HIGH priority: ${event.getPlayerName()} ödül alıyor...`);
    }
    
    @Xady.EventHandler(Xady.EventPriority.MONITOR)
    async onPlayerRewardMonitor(event: PlayerRewardEvent) {
        // Sadece gözlem - değişiklik yapma
        console.log(`📊 MONITOR: Final ödül = ${event.getRewardAmount()}`);
    }
}
