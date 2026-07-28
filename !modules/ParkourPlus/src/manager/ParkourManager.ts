import ParkourPlusModule from "src";
import ParkourSession from "../models/ParkourSession";
import Bot from "typings/xady";
import ParkourStateMachine from "../parkour/ParkourStateMachine";
export type ParkourConfig = {
    startCommand: string;
    spawnCommand: string;
    successPattern: RegExp;
    fallPattern: RegExp;
    successScoreGroup: number;
    successMoneyGroup: number;
    fallScoreGroup: number;
    thousandSeparator: string;
};

export default class ParkourManager {
    #sessions: Map<string, ParkourSession> = new Map();
    #config: ParkourConfig;
    #stateMachines: Map<string, ParkourStateMachine> = new Map();

    constructor(pModule: ParkourPlusModule) {
        this.#config = this.#buildConfig(pModule.getConfig());
    }

    #buildConfig(cfg: any): ParkourConfig {
        return {
            startCommand: cfg.getString("parkour.start_command", "/ajp start"),
            spawnCommand: cfg.getString("parkour.spawn_command", "/spawn"),
            successPattern: new RegExp(cfg.getString("parkour.patterns.success", ""), ""),
            fallPattern: new RegExp(cfg.getString("parkour.patterns.fall", ""), ""),
            successScoreGroup: cfg.getInt("parkour.groups.success_score", 1),
            successMoneyGroup: cfg.getInt("parkour.groups.success_money", 2),
            fallScoreGroup: cfg.getInt("parkour.groups.fall_score", 1),
            thousandSeparator: cfg.getString("parkour.money_format.thousand_separator", "."),
        };
    }

    updateConfig(config: any) {
        this.#config = this.#buildConfig(config);
    }

    getConfig(): ParkourConfig {
        return this.#config;
    }

    startLoop(username: string, maxScore: number, bot?: any) {
        let session = this.#sessions.get(username);
        if (!session) {
            session = new ParkourSession(username, maxScore);
            this.#sessions.set(username, session);
        } else {
            session.maxScore = maxScore;
        }

        session.isRunning = true;

        // İlk komutu gönder
        this.#sendStartCommand(username, bot);
    }

    stopLoop(username: string) {
        const session = this.#sessions.get(username);
        if (session) {
            session.isRunning = false;

            const sm = this.#stateMachines.get(username);
            if (sm) {
                const bot = this.#getBot();
                if (bot) {
                    sm.stop(bot);
                }
                this.#stateMachines.delete(username);
            }
        }
    }

    getSession(username: string): ParkourSession | undefined {
        return this.#sessions.get(username);
    }

    getAllSessions(): ParkourSession[] {
        return Array.from(this.#sessions.values());
    }

    handleSuccessMessage(message: string, bot: any): boolean {
        const match = message.match(this.#config.successPattern);
        if (!match) return false;

        const score = parseInt(match[this.#config.successScoreGroup]);
        const moneyStr = match[this.#config.successMoneyGroup];
        const money = this.#parseMoney(moneyStr);

        // Bot'un username'ini al
        const username = bot?.username;
        if (!username) return false;

        const session = this.#sessions.get(username);
        if (!session || !session.isRunning) return false;

        // Skoru ve parayı kaydet
        session.addScore(score, money);

        console.log(`[ParkourPlus] ${username} - Skor: ${score}, Para: ${money}⛁, Toplam: ${session.totalScore}`);

        // Max skora ulaştı mı?
        if (session.shouldStop()) {
            console.log(`[ParkourPlus] ${username} - Max skora ulaşıldı (${session.maxScore}). Durduruluyor...`);
            this.#finishSession(username, bot);
        }

        return true;
    }

    handleFallMessage(message: string, bot: any): boolean {
        const match = message.match(this.#config.fallPattern);
        if (!match) return false;

        const score = parseInt(match[this.#config.fallScoreGroup]);

        const username = bot?.username;
        if (!username) return false;

        const session = this.#sessions.get(username);
        if (!session || !session.isRunning) return false;

        // Düşüş skorunu kaydet
        session.onFall(score);

        console.log(`[ParkourPlus] ${username} - Düştü! Son skor: ${score}, Toplam: ${session.totalScore}`);

        // Para transferi yap (düşüşte kazanılan para session.totalMoney'de)
        if (session.totalMoney > 0) {
            this.#transferMoneyToWebPos(username, session.totalMoney);
            session.totalMoney = 0; // Sıfırla
        }

        // Devam et mi?
        if (session.shouldStop()) {
            console.log(`[ParkourPlus] ${username} - Max skora ulaşıldı (${session.maxScore}). Durduruluyor...`);
            this.#finishSession(username, bot);
        } else {
            // Tekrar başlat
            setTimeout(() => {
                if (session.isRunning) {
                    this.#sendStartCommand(username, bot);
                }
            }, 2000);
        }

        return true;
    }

    #sendStartCommand(username: string, bot?: any) {
        const b = bot || this.#getBot();
        if (!b) {
            console.error('[ParkourPlus] Bot bulunamadı!');
            return;
        }

        b.chat(this.#config.startCommand);
        console.log(`[ParkourPlus] ${username} - Parkur başlatıldı: ${this.#config.startCommand}`);

        this.#startContinuousJump(username, b);
    }

    #startContinuousJump(username: string, bot: Bot.Bot) {
        const session = this.#sessions.get(username);
        if (!session) return;
        bot.pathfinder.goal

        
    }

    #finishSession(username: string, bot: any) {
        const session = this.#sessions.get(username);
        if (!session) return;

        session.isRunning = false;

        // Kalan parayı transfer et
        if (session.totalMoney > 0) {
            this.#transferMoneyToWebPos(username, session.totalMoney);
            session.totalMoney = 0;
        }

        // Spawn'a ışınlan
        bot.chat(this.#config.spawnCommand);
        console.log(`[ParkourPlus] ${username} - Session tamamlandı. Toplam skor: ${session.totalScore}`);
    }

    #transferMoneyToWebPos(username: string, amount: number) {
        try {
            const ParkourPlusModule = require("../index").default;
            const webPos = ParkourPlusModule.getInstance().getWebPos();

            if (!webPos) {
                console.error("[ParkourPlus] WebPos modülü bulunamadı!");
                return;
            }

            const storage = webPos.getPosManager().getStorage();
            let user = storage.getUser(username);

            if (!user) {
                user = storage.createUser(username);
            }

            user.addBalance(amount);
            storage.saveUser(user);

            console.log(`[ParkourPlus] ${username} - ${amount}⛁ WebPos bakiyesine eklendi.`);
        } catch (err) {
            console.error("[ParkourPlus] Para transferi hatası:", err);
        }
    }

    #parseMoney(moneyStr: string): number {
        // Binlik ayırıcıyı kaldır
        let cleaned = moneyStr.replace(new RegExp(`\\${this.#config.thousandSeparator}`, 'g'), '');
        return parseFloat(cleaned) || 0;
    }

    #getBot(): any {
        try {
            const ParkourPlusModule = require("../index").default;
            return ParkourPlusModule.getInstance().getClient().getBot();
        } catch {
            return null;
        }
    }

    stopAll() {
        const bot = this.#getBot();
        
        for (const [username, sm] of this.#stateMachines.entries()) {
            if (bot) {
                sm.stop(bot);
            }
        }
        this.#stateMachines.clear();

        for (const session of this.#sessions.values()) {
            session.isRunning = false;
        }
    }
}
