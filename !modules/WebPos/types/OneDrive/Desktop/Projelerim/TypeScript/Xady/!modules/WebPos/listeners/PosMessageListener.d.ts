/**
 * Xady EventHandler ile bot mesajlarını dinler.
 * Bot'a gelen chat mesajlarını config'deki regex ile eşleştirir,
 * oyuncu adını ve para miktarını çıkarır.
 */
export default class PosMessageListener {
    #private;
    constructor();
    recompile(): void;
    onMessage(event: Xady.events.MessageEvent): void;
}
