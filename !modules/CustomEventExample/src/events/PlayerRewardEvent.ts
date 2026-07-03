/**
 * Custom Event Örneği
 * Modüller kendi event'lerini oluşturabilir
 */
export default class PlayerRewardEvent extends Xady.XadyEvent {
    private playerName: string;
    private rewardAmount: number;
    private rewardType: string;

    constructor(playerName: string, rewardAmount: number, rewardType: string) {
        super();
        this.playerName = playerName;
        this.rewardAmount = rewardAmount;
        this.rewardType = rewardType;
    }

    getPlayerName(): string {
        return this.playerName;
    }

    getRewardAmount(): number {
        return this.rewardAmount;
    }

    getRewardType(): string {
        return this.rewardType;
    }

    setRewardAmount(amount: number): void {
        this.rewardAmount = amount;
    }
}
