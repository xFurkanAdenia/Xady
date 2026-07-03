import WebPanelModule from "WebPanel";
import "../typings/xady"
import { CommandExecutor, CommandSender, PluginCommand } from "../typings/xady"
import PosManager, { PosConfig } from "./manager/PosManager";
import PosHttpHandler from "./http/PosHttpHandler";
import PosMessageListener from "./listeners/PosMessageListener";
import PosStorage from "./storage/PosStorage";
import PosFunctionRegistry from "./manager/PosFunctionRegistry";
import path from "path";

function buildConfigFromFile(cfg: any): PosConfig {
    return {
        pattern: cfg.getString("message.pattern", "^\\$\\((.*)\\) (.*) oyuncusundan alındı\\.$"),
        usernameIndex: cfg.getInt("message.username_index", 2),
        amountIndex: cfg.getInt("message.amount_index", 1),
        decimalSeparator: (cfg.getString("message.decimal_separator", "comma_decimal") === "dot_decimal" ? "dot_decimal" : "comma_decimal") as PosConfig["decimalSeparator"],
        payCommand: cfg.getString("pay_command", "/pay {username} {amount}"),
        paymentTimeoutMinutes: cfg.getInt("payment_timeout_minutes", 15),
        messages: {
            success: cfg.getString("messages.success", "Ödemeniz onaylandı! Para üstü: {change}"),
            success_exact: cfg.getString("messages.success_exact", "Ödemeniz onaylandı!"),
            insufficient: cfg.getString("messages.insufficient", "Attığınız para ödemeniz için yetersiz! Gerekli: {amount}"),
            no_payment: cfg.getString("messages.no_payment", "Aktif bir ödemeniz bulunmuyor!"),
            refund: cfg.getString("messages.refund", "Para iade edildi."),
        },
    };
}

export default class WebPosModule extends Xady.Module {
    static #instance: WebPosModule;

    #posManager!: PosManager;
    #httpHandler!: PosHttpHandler;
    #listener!: PosMessageListener;
    #storage!: PosStorage;
    #functionRegistry!: PosFunctionRegistry;
    #registeredHttpHandler?: (req: any, res: any, ctx?: any) => boolean | Promise<boolean>;

    onEnable(): void {
        WebPosModule.#instance = this;

        // Config yükle
        this.saveDefaultConfig();
        this.reloadConfig();
        const posConfig = buildConfigFromFile(this.getConfig());

        // Storage path
        const storagePath = path.join(this.getDataFolder(), "pos_data.json");
        this.#storage = new PosStorage(storagePath);

        // Function registry
        this.#functionRegistry = new PosFunctionRegistry();

        // Manager ve handler'ları oluştur
        this.#posManager = new PosManager(posConfig, this.#storage);
        this.#httpHandler = new PosHttpHandler();

        // SSE olay dinleyicileri
        this.#posManager.onNew(payment => {
            this.#httpHandler.push("pos_new", payment.toJSON());
        });
        this.#posManager.onComplete(payment => {
            this.#httpHandler.push("pos_complete", payment.toJSON());
            // WebPanel sohbetine bildirim yaz
            const webPanel = this.#getWebPanel();
            webPanel?.webApi?.pushChat?.(`[POS] ✅ ${payment.getUsername()} → ${payment.getAmount()} ödeme tamamlandı.`);
        });
        this.#posManager.onCancel(payment => {
            this.#httpHandler.push("pos_cancel", payment.toJSON());
        });

        // WebPanel entegrasyonu
        const webPanel = this.#getWebPanel();
        if (!webPanel?.webApi) {
            console.error("[WebPos] WebPanel modülü bulunamadı!");
            return;
        }

        const webApi = webPanel.webApi;
        const cfg = this.getConfig();
        const navTitle = cfg.getString("webpanel.nav_title", "POS Ödemeleri");
        const navPath = cfg.getString("webpanel.nav_path", "/pos");
        const navPerm = cfg.getString("webpanel.permission", "pos.view");

        // Ana nav: POS cihazı
        webApi.registerNav({
            id: "webpos",
            title: navTitle,
            path: navPath,
            permission: navPerm,
            scope: "app",
        });

        // POS cihazını ana sayfa olarak kaydet
        webApi.registerView(navPath, async (req: any, ctx: any) => {
            if (!ctx.hasPerm("pos.view")) {
                return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            }
            const buf = this.getResource("src/views/pos-simple-compiled.html");
            if (buf) return buf.toString("utf8");
            return `<div class="card"><div class="card-body text-danger">[WebPos] POS görünümü bulunamadı.</div></div>`;
        });

        // Geçmiş/İade sayfası
        webApi.registerView("/pos/history", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("pos.view")) {
                return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            }
            const buf = this.getResource("src/views/pos-compiled.html");
            if (buf) return buf.toString("utf8");
            return `<div class="card"><div class="card-body text-danger">[WebPos] Görünüm dosyası bulunamadı.</div></div>`;
        });

        webApi.registerView("/pos/config", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("pos.config")) {
                return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            }
            const buf = this.getResource("src/views/pos_config.html");
            if (buf) return buf.toString("utf8");
            return `<div class="card"><div class="card-body text-danger">[WebPos] Config görünüm dosyası bulunamadı.</div></div>`;
        });

        // Config sayfasını admin paneline ekle
        webApi.registerNav({
            id: "webpos_config",
            title: "POS Ayarları",
            path: "/pos/config",
            permission: "pos.config",
            scope: "admin",
        });

        // İzinleri kaydet
        webApi.registerPermission({ id: "pos.view", description: "POS sayfasını görüntüleme" });
        webApi.registerPermission({ id: "pos.create", description: "Yeni ödeme oluşturma" });
        webApi.registerPermission({ id: "pos.cancel", description: "Ödeme iptal etme" });
        webApi.registerPermission({ id: "pos.config", description: "POS config görüntüleme ve düzenleme" });

        // HTTP handler'ı kaydet
        this.#registeredHttpHandler = this.#httpHandler.getHandler();
        webApi.registerHttp(this.#registeredHttpHandler);

        // Mesaj dinleyici
        this.#listener = new PosMessageListener();
        this.registerEvents(this.#listener);
        const modulee = this;
        // !webPos komutunu kaydet
        const cmd: PluginCommand = new Xady.PluginCommand("webPos", this)
            .setExecutor(class implements CommandExecutor {
                onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): boolean | Promise<boolean> {
                    const sub = args[0]?.toLowerCase();
                    if (sub === "reload") {
                        try {
                            modulee.reloadConfig();
                            const newCfg = buildConfigFromFile(modulee.getConfig());
                            modulee.#posManager.updateConfig(newCfg);
                            modulee.#listener.recompile();
                            sender.sendMessage("[WebPos] Config yeniden yüklendi!");
                        } catch (e: any) {
                            sender.sendMessage("[WebPos] Reload hatası: " + (e?.message ?? e));
                        }
                        return true;
                    }
                    sender.sendMessage("[WebPos] Kullanım: !webPos reload");
                    return true;
                }
            });
        this.getClient().getCommandManager().registerCommand(cmd);

        console.log("[WebPos] Modül başarıyla yüklendi.");
    }

    onDisable(): void {
        this.#posManager?.destroyAll();
        this.#httpHandler?.destroySse();

        const webPanel = this.#getWebPanel();
        if (webPanel?.webApi) {
            const cfg = this.getConfig();
            const navPath = cfg.getString("webpanel.nav_path", "/pos");

            webPanel.webApi.unregisterNav("webpos");
            webPanel.webApi.unregisterNav("webpos_config");
            webPanel.webApi.unregisterView(navPath);
            webPanel.webApi.unregisterView("/pos/history");
            webPanel.webApi.unregisterView("/pos/config");
            webPanel.webApi.unregisterPermission("pos.view");
            webPanel.webApi.unregisterPermission("pos.create");
            webPanel.webApi.unregisterPermission("pos.cancel");
            webPanel.webApi.unregisterPermission("pos.config");
            if (this.#registeredHttpHandler) {
                webPanel.webApi.unregisterHttp(this.#registeredHttpHandler);
            }
        }
    }

    getPosManager(): PosManager {
        return this.#posManager;
    }

    getFunctionRegistry(): PosFunctionRegistry {
        return this.#functionRegistry;
    }

    /**
     * Dosya config ham verisini dön (WebPanel config sayfası için)
     */
    getFileConfig(): Record<string, any> {
        this.reloadConfig();
        const cfg = this.getConfig();
        return {
            message: {
                pattern: cfg.getString("message.pattern", ""),
                username_index: cfg.getInt("message.username_index", 2),
                amount_index: cfg.getInt("message.amount_index", 1),
                decimal_separator: cfg.getString("message.decimal_separator", "comma_decimal"),
            },
            pay_command: cfg.getString("pay_command", "/pay {username} {amount}"),
            payment_timeout_minutes: cfg.getInt("payment_timeout_minutes", 15),
            messages: {
                success: cfg.getString("messages.success", ""),
                success_exact: cfg.getString("messages.success_exact", ""),
                insufficient: cfg.getString("messages.insufficient", ""),
                no_payment: cfg.getString("messages.no_payment", ""),
                refund: cfg.getString("messages.refund", ""),
            },
            webpanel: {
                nav_title: cfg.getString("webpanel.nav_title", "POS Ödemeleri"),
                nav_path: cfg.getString("webpanel.nav_path", "/pos"),
                permission: cfg.getString("webpanel.permission", "pos.view"),
            },
        };
    }

    /**
     * WebPanel config sayfasından gelen güncellenmiş config objesini kaydeder ve yeniden yükler.
     */
    updateAndReloadConfig(incoming: any) {
        const cfg = this.getConfig();

        if (incoming?.message?.pattern !== undefined)
            cfg.set("message.pattern", String(incoming.message.pattern));
        if (incoming?.message?.username_index !== undefined)
            cfg.set("message.username_index", Number(incoming.message.username_index));
        if (incoming?.message?.amount_index !== undefined)
            cfg.set("message.amount_index", Number(incoming.message.amount_index));
        if (incoming?.message?.decimal_separator !== undefined)
            cfg.set("message.decimal_separator", String(incoming.message.decimal_separator));
        if (incoming?.pay_command !== undefined)
            cfg.set("pay_command", String(incoming.pay_command));
        if (incoming?.payment_timeout_minutes !== undefined)
            cfg.set("payment_timeout_minutes", Number(incoming.payment_timeout_minutes));

        const msgs = incoming?.messages;
        if (msgs) {
            if (msgs.success !== undefined) cfg.set("messages.success", String(msgs.success));
            if (msgs.success_exact !== undefined) cfg.set("messages.success_exact", String(msgs.success_exact));
            if (msgs.insufficient !== undefined) cfg.set("messages.insufficient", String(msgs.insufficient));
            if (msgs.no_payment !== undefined) cfg.set("messages.no_payment", String(msgs.no_payment));
            if (msgs.refund !== undefined) cfg.set("messages.refund", String(msgs.refund));
        }

        this.saveConfig();

        // Manager'ı güncelle
        this.reloadConfig();
        const newCfg = buildConfigFromFile(this.getConfig());
        this.#posManager.updateConfig(newCfg);
        this.#listener.recompile();
    }

    #getWebPanel(): WebPanelModule | undefined {
        return WebPosModule.getModule<WebPanelModule>("WebPanel");
    }

    static getInstance(): WebPosModule {
        return this.#instance;
    }
}
