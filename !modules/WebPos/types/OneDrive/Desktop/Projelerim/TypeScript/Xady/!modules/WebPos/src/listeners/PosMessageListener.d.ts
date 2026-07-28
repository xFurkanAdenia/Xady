import "../../typings/xady";
/**
 * Xady EventHandler ile bot mesajlarını dinler.
 * Bot'a gelen chat mesajlarını config'deki regex ile eşleştirir,
 * oyuncu adını ve para miktarını çıkarır.
 */
export default class PosMessageListener implements Xady.Listener {
    #private;
    constructor();
    recompile(): void;
    onMessage(event: Xady.events.MessageEvent): void;
    onMessageStr(event: Xady.events.MessageStrEvent): void;
    onUnmatchedMessage(event: Xady.events.UnmatchedMessageEvent): void;
    onPlayerChat(event: Xady.events.PlayerChatEvent): void;
}
