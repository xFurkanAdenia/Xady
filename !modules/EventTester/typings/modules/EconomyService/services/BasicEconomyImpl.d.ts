import EconomyAPI from "./EconomyAPI";
/**
 * Basit Economy Implementation
 * Dosya tabanlı para sistemi
 */
export default class BasicEconomyImpl extends EconomyAPI {
    private dataFile;
    private playerMoney;
    constructor(dataFolder: string);
    private loadData;
    private saveData;
    getMoney(player: string): Promise<number>;
    addMoney(player: string, amount: number): Promise<boolean>;
    removeMoney(player: string, amount: number): Promise<boolean>;
    hasMoney(player: string, amount: number): Promise<boolean>;
    transferMoney(from: string, to: string, amount: number): Promise<boolean>;
    getTopPlayers(): Promise<Array<{
        player: string;
        money: number;
    }>>;
}
