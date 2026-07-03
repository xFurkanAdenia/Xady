import { XadyEvent } from "../XadyEvent";
/**
 * Bot'a gelen tüm mesajları yakalar (chat, system, whisper vb.)
 * Mineflayer'ın 'message' eventi için wrapper
 */
export declare class MessageEvent extends XadyEvent {
    private jsonMsg;
    private position;
    constructor(jsonMsg: any, position: string);
    /**
     * Mesajın JSON formatını döndürür
     */
    getJsonMessage(): any;
    /**
     * Mesajın pozisyonunu döndürür (chat, system, game_info vb.)
     */
    getPosition(): string;
    /**
     * Mesajı düz metin olarak döndürür
     */
    toString(): string;
    /**
     * Mesajı ANSI renkleriyle döndürür
     */
    toAnsi(): string;
    /**
     * Mesajı renkler olmadan döndürür
     */
    toMotd(): string;
}
