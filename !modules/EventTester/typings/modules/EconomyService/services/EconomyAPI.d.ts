/**
 * Economy Service Interface
 * Diğer modüller bu interface'i kullanarak economy işlemleri yapar
 */
export default abstract class EconomyAPI {
    /**
     * Oyuncunun parasını alır
     */
    abstract getMoney(player: string): Promise<number>;
    /**
     * Oyuncuya para ekler
     */
    abstract addMoney(player: string, amount: number): Promise<boolean>;
    /**
     * Oyuncudan para çıkarır
     */
    abstract removeMoney(player: string, amount: number): Promise<boolean>;
    /**
     * Oyuncunun yeterli parası var mı kontrol eder
     */
    abstract hasMoney(player: string, amount: number): Promise<boolean>;
    /**
     * Para transferi yapar
     */
    abstract transferMoney(from: string, to: string, amount: number): Promise<boolean>;
    /**
     * Tüm oyuncuların parasını listeler
     */
    abstract getTopPlayers(): Promise<Array<{
        player: string;
        money: number;
    }>>;
}
