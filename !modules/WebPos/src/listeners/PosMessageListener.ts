import "../../typings/xady";
import WebPosModule from "..";

/**
 * Xady EventHandler ile bot mesajlarını dinler.
 * Bot'a gelen chat mesajlarını config'deki regex ile eşleştirir,
 * oyuncu adını ve para miktarını çıkarır.
 */
export default class PosMessageListener implements Xady.Listener {
    #compiledPattern: RegExp | null = null;

    constructor() {
        this.#recompilePattern();
    }

    #recompilePattern() {
        try {
            const instance = WebPosModule.getInstance();
            const cfg = instance?.getPosManager()?.getConfig();
            if (cfg?.pattern) {
                this.#compiledPattern = new RegExp(cfg.pattern);
            }
        } catch (e) {
            console.error("[WebPos] Pattern derleme hatası:", e);
            this.#compiledPattern = null;
        }
    }

    recompile() {
        this.#recompilePattern();
    }

    #processMessage(rawText: string) {
        if (!this.#compiledPattern) return;

        const match = this.#compiledPattern.exec(rawText);
        if (!match) return;

        const instance = WebPosModule.getInstance();
        if (!instance) return;

        const manager = instance.getPosManager();
        const cfg = manager.getConfig();

        // 1-indexed capture groups
        const usernameRaw = match[cfg.usernameIndex];
        const amountRaw = match[cfg.amountIndex];

        if (!usernameRaw || !amountRaw) return;

        const username = usernameRaw.trim();
        const bot = instance.getClient().getBot();

        // Bot'un kendi mesajına tepki verme
        if (bot && username === bot.username) return;

        manager.handleIncomingPayment(username, amountRaw.trim(), bot);
    }

    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    onMessage(event: Xady.events.MessageEvent) {
        try {
            const rawText = event.toString();
            this.#processMessage(rawText);
        } catch (e) {
            // Ignore
        }
    }

    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    onMessageStr(event: Xady.events.MessageStrEvent) {
        try {
            const rawText = event.toString();
            this.#processMessage(rawText);
        } catch (e) {
            // Ignore
        }
    }

    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    onUnmatchedMessage(event: Xady.events.UnmatchedMessageEvent) {
        try {
            const rawText = event.toString();
            this.#processMessage(rawText);
        } catch (e) {
            // Ignore
        }
    }

    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    onPlayerChat(event: Xady.events.PlayerChatEvent) {
        try {
            const rawText = event.toString();
            this.#processMessage(rawText);
        } catch (e) {
            // Ignore
        }
    }
}
