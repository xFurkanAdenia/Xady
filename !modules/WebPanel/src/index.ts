import "../typings/xady";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
import { WebPanelServer } from "./webServer";
import { WebPanelApi } from "./types";


type NavItem = { 
    id: string; 
    title: string; 
    path: string; 
    permission?: string; 
    scope?: "app" | "admin";
    children?: NavItem[]; // Dropdown için alt öğeler
    onClick?: string; // JavaScript fonksiyon adı
};
type ViewHandler = (req: any, ctx: any) => Promise<string> | string;
type PermissionDef = { id: string; description: string; defaultRole?: string };
type HttpHandler = (req: any, res: any, ctx?: { session: { username: string; roles: string[]; permissions: string[] } | null; hasPerm: (perm: string) => boolean }) => boolean | Promise<boolean>;

function sanitizeText(s: string) {
    return s.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 300);
}

async function readView(name: string): Promise<string> {
    try {
        return await readFile(path.join(process.cwd(), "src", "modules", "WebPanel", "assets", "views", name), "utf8");
    } catch {
        const instance = WebPanelModule.getInstance();
        if (instance) {
            const buf = instance.getResource("src/assets/views/" + name);
            if (buf) return buf.toString("utf8");
        }
        return await readFile(path.join(__dirname, "assets", "views", name), "utf8");
    }
}

export default class WebPanelModule extends Xady.Module {
    static #instance: WebPanelModule;
    #http?: ReturnType<typeof createServer>;
    #server?: WebPanelServer;
    #nav = new Map<string, NavItem>();
    #views = new Map<string, ViewHandler>();
    #permissions = new Map<string, PermissionDef>();
    #httpHandlers = new Set<HttpHandler>();
    #chatListener?: WebPanelChatListener;
    webApi?: WebPanelApi;

    onEnable(): void {
        WebPanelModule.#instance = this;
        const client = this.getClient();

        this.#nav.set("dashboard", { id: "dashboard", title: "Panel", path: "/", permission: "dashboard.view", scope: "app" });
        this.#nav.set("settings", { id: "settings", title: "Ayarlar", path: "/settings", permission: "settings.view", scope: "app" });
        this.#nav.set("chat", { id: "chat", title: "Sohbet", path: "/chat", permission: "chat.view", scope: "app" });
        this.#nav.set("modules", { id: "modules", title: "Modüller", path: "/admin/modules", permission: "modules.view", scope: "admin" });
        this.#nav.set("users", { id: "users", title: "Kullanıcılar", path: "/admin/users", permission: "admin.users.read", scope: "admin" });
        this.#nav.set("roles", { id: "roles", title: "Roller", path: "/admin/roles", permission: "admin.roles.read", scope: "admin" });
        this.#nav.set("apikeys", { id: "apikeys", title: "API Key Yönetimi", path: "/admin/apikeys", permission: "admin.apikeys.read", scope: "admin" });

        this.#server = new WebPanelServer({ 
            client, 
            nav: this.#nav, 
            views: this.#views,
            permissions: this.#permissions,
            httpHandlers: this.#httpHandlers 
        });

        this.webApi = {
            registerNav: (item: NavItem) => this.#nav.set(item.id, item),
            unregisterNav: (id: string) => this.#nav.delete(id),
            registerView: (path: string, handler: ViewHandler) => this.#views.set(path.startsWith('/') ? path : '/' + path, handler),
            unregisterView: (path: string) => this.#views.delete(path.startsWith('/') ? path : '/' + path),
            registerPermission: (perm: PermissionDef) => this.#permissions.set(perm.id, perm),
            unregisterPermission: (id: string) => this.#permissions.delete(id),
            registerHttp: (handler: HttpHandler) => this.#httpHandlers.add(handler),
            unregisterHttp: (handler: HttpHandler) => this.#httpHandlers.delete(handler),
            pushChat: (text: string) => this.#server?.pushChat({ at: Date.now(), text, source: "server" }),
        };

        this.registerBuiltinViews();

        this.#chatListener = new WebPanelChatListener(this.#server);
        this.registerEvents(this.#chatListener);

        const webCfg = (Xady.settings.getConfig() as any).web;
        if (webCfg?.enabled === false) return;

        this.#http = createServer((req, res) => this.#server?.handle(req, res));
        void this.#server.start();
        this.#http.listen(Number(webCfg?.port ?? 8787), String(webCfg?.bindHost ?? "0.0.0.0"), () => {
            console.log(`WebPanel: http://${webCfg?.bindHost ?? "127.0.0.1"}:${webCfg?.port ?? 8787}/`);
        });
    }

    private registerBuiltinViews() {
        const web = this.webApi;
        if (!web) return;

        web.registerView("/", async (req: any, ctx: any) => {
            return await readView("home.html");
        });

        web.registerView("/profile", async (req: any, ctx: any) => {
            let html = await readView("profile.html");
            const rolesHtml = ctx.session.roles.map((r: string) => `<span class="badge primary">${r}</span>`).join(' ');
            html = html.replace("{{USERNAME}}", ctx.session.username);
            html = html.replace("{{ROLES_HTML}}", rolesHtml);
            return html;
        });

        web.registerView("/settings", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("settings.view")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            const canWrite = ctx.hasPerm("settings.write");
            let html = await readView("settings.html");
            const btnHtml = canWrite ? '<button class="btn btn-primary" onclick="window.saveSettings()" style="margin-top: 20px;">Ayarları Kaydet</button>' : '';
            html = html.replace("{{BUTTON_HTML}}", btnHtml);
            return html;
        });

        web.registerView("/chat", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("chat.view")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            const canSend = ctx.hasPerm("chat.send");
            let html = await readView("chat.html");
            const sendHtml = canSend ? `
        <div style="padding: 15px; border-top: 1px solid var(--border); display: flex; gap: 10px; background: var(--bg-surface); position: relative;">
            <div id="chat-autocomplete" style="display: none; position: absolute; bottom: 100%; left: 15px; right: 15px; max-height: 200px; overflow-y: auto; background: var(--bg-surface); border: 1px solid var(--border); border-bottom: none; border-radius: 8px 8px 0 0; z-index: 10;">
                <!-- Autocomplete items will be injected here -->
            </div>
            <input type="text" id="chat-input" class="form-control" placeholder="Mesaj yazın..." style="flex-grow: 1;" onkeydown="window.handleChatKey(event)" oninput="window.handleChatInput(event)">
            <button class="btn btn-primary" onclick="window.sendChat()">Gönder</button>
        </div>` : '';
            html = html.replace("{{SEND_HTML}}", sendHtml);
            return html;
        });

        web.registerView("/admin/roles", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("admin.roles.read")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            return await readView("roles.html");
        });

        web.registerView("/admin/modules", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("modules.view")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            return await readView("modules.html");
        });
        web.registerView("/admin/users", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("admin.users.read")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            return await readView("users.html");
        });

        web.registerView("/admin/apikeys", async (req: any, ctx: any) => {
            if (!ctx.hasPerm("admin.apikeys.read")) return `<div class="card"><div class="card-body text-danger">Yetkiniz yok.</div></div>`;
            return await readView("apikeys.html");
        });
    }

    onDisable(): void {

        try {
            if (this.#http && 'closeAllConnections' in this.#http) {
                (this.#http as any).closeAllConnections();
            }
            this.#http?.close();
        } catch { }
        this.#http = undefined;

        void this.#server?.stop();
        this.#server = undefined;

        this.#httpHandlers.clear();
        this.#nav.clear();
        this.#views.clear();
        this.#permissions.clear();

        if (this.webApi) delete this.webApi;
    }

    static getInstance() {
        return this.#instance;
    }
}

/**
 * Xady event sistemiyle bot mesajlarını dinleyen listener.
 * bot.on() güvenlik kısıtlaması nedeniyle blocked olduğundan
 * registerEvents() + @EventHandler() kullanılmalı.
 */
class WebPanelChatListener implements Xady.Listener {
    #server: WebPanelServer;

    constructor(server: WebPanelServer) {
        this.#server = server;
    }

    @Xady.EventHandler(Xady.EventPriority.NORMAL)
    onMessage(event: Xady.MessageEvent) {
        let htmlText = "";
        try {
            // MessageEvent.toString() → düz metin
            // MessageEvent.toAnsi() → ANSI renkleri
            // MessageEvent.getJsonMessage() → ChatMessage objesi (toHTML() var)
            const jsonMsg = event.getJsonMessage();
            if (jsonMsg && typeof (jsonMsg as any).toHTML === "function") {
                htmlText = (jsonMsg as any).toHTML();
            } else {
                htmlText = event.toString();
                htmlText = htmlText
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
            }
        } catch {
            try {
                htmlText = event.toString()
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
            } catch { return; }
        }

        if (!htmlText || htmlText.trim() === "") return;
        this.#server.pushChat({ at: Date.now(), text: htmlText, source: "bot" });
    }
}
