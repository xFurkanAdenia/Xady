import WebPosModule from "..";
import { POS_PAYMENT_STATUS } from "../models/PosPayment";

/**
 * Xady EventHandler ile bot mesajlarını dinler.
 * Bot'a gelen chat mesajlarını config'deki regex ile eşleştirir,
 * oyuncu adını ve para miktarını çıkarır.
 */
export default class PosMessageListener {
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

    @Xady.EventHandler()
    onMessage(event: Xady.events.MessageEvent) {
        if (!this.#compiledPattern) return;

        let rawText: string;
        try {
            rawText = event.toString();
        } catch {
            return;
        }

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
}
