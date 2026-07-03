/**
 * Başka bir modülün custom event'ini dinleyen listener
 *
 * ÖNEMLI: Event class'ının tam adını kullanmalısın
 * Event class'ı constructor.name ile eşleştirilir
 */
export default class RewardLogListener implements Xady.Listener {
    onReward(event: any): Promise<void>;
    private logToFile;
}
