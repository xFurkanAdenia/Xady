import { XadyEvent } from "../XadyEvent";
import { ChatMessage } from "prismarine-chat";

/**
 * Bot'a gelen tüm mesajları yakalar (chat, system, whisper vb.)
 * Mineflayer'ın 'message' eventi için wrapper
 */
export class MessageEvent extends XadyEvent {
    private jsonMsg: ChatMessage;
    private position: string;

    constructor(jsonMsg: ChatMessage, position: string) {
        super();
        this.jsonMsg = jsonMsg;
        this.position = position;
    }

    /**
     * Mesajın JSON formatını döndürür
     */
    getJsonMessage(): ChatMessage {
        return this.jsonMsg;
    }

    /**
     * Mesajın pozisyonunu döndürür (chat, system, game_info vb.)
     */
    getPosition(): string {
        return this.position;
    }

    /**
     * Mesajı düz metin olarak döndürür
     */
    toString(): string {
        return this.jsonMsg?.toString() || "";
    }

    /**
     * Mesajı ANSI renkleriyle döndürür
     */
    toAnsi(): string {
        return this.jsonMsg?.toAnsi?.() || this.toString();
    }

    /**
     * Mesajı renkler olmadan döndürür
     */
    toMotd(): string {
        return this.jsonMsg?.toMotd?.() || this.toString();
    }
}
