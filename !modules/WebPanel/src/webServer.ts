import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";
import { AssetStore } from "./assets";
import { clearSessionCookie, hashPassword, SessionStore, sessionCookie, verifyPassword } from "./auth";
import { html, json, parseCookies, readBody, redirect, sendBuffer, text } from "./http";
import { UserStore } from "./users";
import { getDbPool } from "./users";
import { createConnection } from "mysql2/promise";

type NavItem = { id: string; title: string; path: string; permission?: string; scope?: "app" | "admin" };
type ViewHandler = (req: IncomingMessage, ctx: HttpHandlerCtx) => Promise<string> | string;
type PermissionDef = { id: string; description: string; defaultRole?: string };
type HttpHandlerCtx = { session: { username: string; roles: string[]; permissions: string[] } | null; hasPerm: (perm: string) => boolean };
type HttpHandler = (req: IncomingMessage, res: ServerResponse, ctx?: HttpHandlerCtx) => boolean | Promise<boolean>;
type ChatEntry = { at: number; text: string; source: "server" | "bot" | "web" };

function sanitizeText(s: string) {
    return s.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 300);
}

function uniqueBy<T>(arr: T[], keyFn: (v: T) => string) {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of arr) {
        const k = keyFn(item);
        if (seen.has(k)) continue;
        seen.add(k);
        out.push(item);
    }
    return out;
}

export class WebPanelServer {
    #assets = new AssetStore();
    #sessions = new SessionStore();
    #users = new UserStore();
    #sse = new Set<ServerResponse>();
    #chat: ChatEntry[] = [];
    #nav: Map<string, NavItem>;
    #views: Map<string, ViewHandler>;
    #permissions: Map<string, PermissionDef>;
    #httpHandlers: Set<HttpHandler>;
    #client: any;

    constructor(opts: { client: any; nav: Map<string, NavItem>; views: Map<string, ViewHandler>; permissions: Map<string, PermissionDef>; httpHandlers: Set<HttpHandler> }) {
        this.#client = opts.client;
        this.#nav = opts.nav;
        this.#views = opts.views;
        this.#permissions = opts.permissions;
        this.#httpHandlers = opts.httpHandlers;
    }

    async start() {
        await this.#users.init();
    }

    async stop() {
        for (const res of this.#sse) {
            try { res.end(); } catch {}
        }
        this.#sse.clear();
        await this.#sessions.clear();
        await this.#users.close();
    }

    pushChat(entry: ChatEntry) {
        this.#chat.push(entry);
        if (this.#chat.length > 200) this.#chat.splice(0, this.#chat.length - 200);
        const payload = `event: msg\ndata: ${JSON.stringify(entry)}\n\n`;
        for (const res of this.#sse) {
            try { 
                res.write(payload); 
                if (typeof (res as any).flush === 'function') {
                    (res as any).flush();
                }
            } catch {}
        }
    }

    private getRolePermissions(roles: string[], customPermissions: string[] = []) {
        const cfg = Xady.settings.getConfig() as any;
        const roleMap = cfg?.auth?.roles ?? {};
        const perms = new Set<string>();
        for (const role of roles) {
            const r = roleMap?.[role];
            const list = Array.isArray(r?.permissions) ? r.permissions : [];
            for (const p of list) perms.add(String(p));
        }
        for (const p of customPermissions) {
            perms.add(String(p));
        }
        return perms;
    }

    private hasPermission(roles: string[], customPermissions: string[], perm: string) {
        const perms = this.getRolePermissions(roles, customPermissions);
        return perms.has("*") || perms.has(perm);
    }

    private async getSession(req: IncomingMessage) {
        let apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
        if (Array.isArray(apiKey)) apiKey = apiKey[0];
        if (typeof apiKey === "string" && apiKey.trim()) {
            const pool = getDbPool();
            if (pool) {
                const [rows] = await pool.query<any[]>("SELECT id, permissions_json FROM xady_api_keys WHERE token_hash=? LIMIT 1", [apiKey.trim()]);
                if (Array.isArray(rows) && rows.length > 0) {
                    let perms: string[] = [];
                    try { perms = JSON.parse(rows[0].permissions_json); } catch {}
                    return { username: "API", roles: [], customPermissions: perms, isApiKey: true, csrfToken: "" };
                }
            }
        }
        const cookies = parseCookies(req.headers.cookie);
        return await this.#sessions.get(cookies["xady_session"]);
    }

    async handle(req: IncomingMessage, res: ServerResponse) {
        try {
            // Security Headers
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("X-XSS-Protection", "1; mode=block");

            const u = new URL(req.url ?? "/", "http://localhost");
            const method = (req.method ?? "GET").toUpperCase();
            const session = await this.getSession(req);

            // CSRF Protection for state-changing methods
            if (session && !session.isApiKey && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
                // Ignore CSRF for login, logout (since login doesn't have session yet, and logout destroys it)
                if (u.pathname !== "/api/login" && u.pathname !== "/api/logout" && u.pathname !== "/api/install") {
                    const csrfHeader = req.headers["x-csrf-token"];
                    if (!csrfHeader || csrfHeader !== session.csrfToken) {
                        return json(res, 403, { ok: false, error: "CSRF token geçersiz." });
                    }
                }
            }
            const perms = session ? Array.from(this.getRolePermissions(session.roles, session.customPermissions)) : [];
            const ctx: HttpHandlerCtx = {
                session: session ? { username: session.username, roles: session.roles, permissions: perms } : null,
                hasPerm: (perm: string) => (session ? this.hasPermission(session.roles, session.customPermissions, perm) : false)
            };

            for (const handler of this.#httpHandlers) {
                const handled = await handler(req, res, ctx);
                if (handled) return;
            }

            const cfg = Xady.settings.getConfig() as any;
            const installed = Boolean(cfg?.web?.installed) && Boolean(cfg?.auth?.db?.enabled);

            if (!installed) {
                if (u.pathname === "/api/install" && method === "POST") {
                    const buf = await readBody(req, 128 * 1024);
                    let parsed: any = {};
                    try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                    const siteTitle = String(parsed?.site?.title ?? "WebPanel").trim() || "WebPanel";
                    const dbHost = String(parsed?.db?.host ?? "").trim();
                    const dbPort = Number(parsed?.db?.port ?? 3306);
                    const dbUser = String(parsed?.db?.user ?? "").trim();
                    const dbPass = String(parsed?.db?.password ?? "");
                    const dbName = String(parsed?.db?.database ?? "").trim();
                    const adminUser = String(parsed?.admin?.username ?? "admin").trim() || "admin";
                    const adminPass = String(parsed?.admin?.password ?? "");
                    if (!dbHost || !dbUser || !dbName || !adminPass) return json(res, 400, { ok: false, error: "Eksik alan." });
                    if (!Number.isFinite(dbPort) || dbPort <= 0) return json(res, 400, { ok: false, error: "Port geçersiz." });

                    const safeName = dbName.replace(/`/g, "");
                    // USE kullanmadan tam nitelikli tablo adlarıyla çalış.
                    // root@% kullanıcısı CREATE DATABASE için global yetkiye sahip olabilir
                    // ama database-level yetkisi olmayabilir; USE komutu bu durumda reddedilir.
                    // Çözüm: tüm sorgularda `dbName`.tablo şeklinde tam yol kullan.
                    const conn = await createConnection({ host: dbHost, port: dbPort, user: dbUser, password: dbPass });
                    try {
                        await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${safeName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
                        // users.ts'deki UserStore şemasıyla birebir uyumlu olmalı
                        await conn.execute(
                            `CREATE TABLE IF NOT EXISTS \`${safeName}\`.xady_users (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                username VARCHAR(64) NOT NULL UNIQUE,
                                password_hash VARCHAR(255) NOT NULL,
                                roles_json TEXT NOT NULL,
                                banned_until BIGINT DEFAULT NULL,
                                ban_reason TEXT DEFAULT NULL,
                                custom_permissions_json TEXT DEFAULT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
                        );
                        await conn.execute(
                            `CREATE TABLE IF NOT EXISTS \`${safeName}\`.xady_sessions (
                                token VARCHAR(128) PRIMARY KEY,
                                username VARCHAR(64) NOT NULL,
                                roles_json TEXT NOT NULL,
                                custom_permissions_json TEXT NOT NULL,
                                csrf_token VARCHAR(128) NOT NULL,
                                created_at BIGINT NOT NULL,
                                last_seen BIGINT NOT NULL
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
                        );
                        await conn.execute(
                            `CREATE TABLE IF NOT EXISTS \`${safeName}\`.xady_api_keys (
                                id INT AUTO_INCREMENT PRIMARY KEY,
                                token_hash VARCHAR(255) NOT NULL,
                                description TEXT DEFAULT NULL,
                                permissions_json TEXT NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
                        );
                        const [rows] = await conn.query<any[]>(`SELECT username FROM \`${safeName}\`.xady_users LIMIT 1`);
                        if (Array.isArray(rows) && rows.length > 0) {
                            return json(res, 409, { ok: false, error: "Veritabanı zaten kurulu." });
                        }
                        await conn.execute(
                            `INSERT INTO \`${safeName}\`.xady_users (username, password_hash, roles_json) VALUES (?, ?, ?)`,
                            [adminUser, hashPassword(adminPass), JSON.stringify(["admin"])]
                        );
                    } finally {
                        try { await conn.end(); } catch {}
                    }





                    Xady.settings.set("web.siteTitle", siteTitle);
                    Xady.settings.set("web.installed", true);
                    Xady.settings.set("auth.db.enabled", true);
                    Xady.settings.set("auth.db.host", dbHost);
                    Xady.settings.set("auth.db.port", dbPort);
                    Xady.settings.set("auth.db.user", dbUser);
                    Xady.settings.set("auth.db.password", dbPass);
                    Xady.settings.set("auth.db.database", dbName);
                    Xady.settings.set("auth.roles", {
                        admin: { permissions: ["*"] },
                        user: { permissions: ["dashboard.view", "chat.view", "chat.send", "settings.view"] }
                    });

                    await this.#users.close();
                    await this.#users.init();
                    return json(res, 200, { ok: true });
                }

                if (u.pathname === "/install" && method === "GET") {
                    const asset = await this.#assets.get("install.html");
                    if (!asset) return text(res, 404, "not_found");
                    return sendBuffer(res, 200, asset.body, asset.contentType, { "cache-control": "no-cache" });
                }

                if (u.pathname.startsWith("/assets/") && method === "GET") {
                    const rel = u.pathname.slice("/assets/".length);
                    const asset = await this.#assets.get(rel);
                    if (!asset) return text(res, 404, "not_found");
                    return sendBuffer(res, 200, asset.body, asset.contentType, { "cache-control": "no-cache" });
                }

                return redirect(res, "/install");
            }

            if (u.pathname === "/login" && method === "GET") {
                if (session) return redirect(res, "/");
                const asset = await this.#assets.get("login.html");
                if (!asset) return text(res, 404, "not_found");
                return sendBuffer(res, 200, asset.body, asset.contentType, { "cache-control": "no-cache" });
            }

            if (u.pathname === "/logout" && method === "GET") {
                const cookies = parseCookies(req.headers.cookie);
                await this.#sessions.delete(cookies["xady_session"]);
                res.setHeader("set-cookie", clearSessionCookie());
                return redirect(res, "/login");
            }

            if (u.pathname.startsWith("/assets/") && method === "GET") {
                const rel = u.pathname.slice("/assets/".length);
                const asset = await this.#assets.get(rel);
                if (!asset) return text(res, 404, "not_found");
                return sendBuffer(res, 200, asset.body, asset.contentType, { "cache-control": "no-cache" });
            }

            // SPA Catch-all route for non-API endpoints
            if (!u.pathname.startsWith("/api/")) {
                if (!session) return redirect(res, "/login");
                if (u.pathname.startsWith("/admin") && !this.hasPermission(session.roles, session.customPermissions, "admin.view")) {
                    return redirect(res, "/");
                }
                const asset = await this.#assets.get("layout.html");
                if (!asset) return text(res, 404, "not_found");
                return sendBuffer(res, 200, asset.body, asset.contentType, { "cache-control": "no-cache" });
            }

            if (u.pathname === "/api/login" && method === "POST") {
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const username = String(parsed?.username ?? "");
                const password = String(parsed?.password ?? "");
                if (!username || !password) return json(res, 400, { ok: false, error: "invalid" });
                const user = await this.#users.getUser(username);
                if (!user) return json(res, 401, { ok: false, error: "denied" });
                
                if (user.bannedUntil) {
                    if (user.bannedUntil === -1 || user.bannedUntil > Date.now()) {
                        const reason = user.banReason || "Hesabınız yasaklanmıştır.";
                        return json(res, 403, { ok: false, error: "banned", reason });
                    }
                }
                
                if (!verifyPassword(password, String(user.passwordHash ?? ""))) return json(res, 401, { ok: false, error: "denied" });
                const { token, csrfToken } = await this.#sessions.create(user.username, Array.isArray(user.roles) ? user.roles.map(String) : [], user.customPermissions ?? []);
                res.setHeader("set-cookie", [sessionCookie(token), `xady_csrf=${csrfToken}; Path=/; SameSite=Lax`]);
                return json(res, 200, { ok: true, csrfToken });
            }

            if (u.pathname === "/api/logout" && method === "POST") {
                const cookies = parseCookies(req.headers.cookie);
                await this.#sessions.delete(cookies["xady_session"]);
                res.setHeader("set-cookie", clearSessionCookie());
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/me" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                return json(res, 200, { ok: true, username: session.username, roles: session.roles, permissions: perms, csrfToken: session.csrfToken });
            }

            if (u.pathname === "/api/me/password" && method === "PUT") {
                if (!session) return json(res, 401, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                
                const currentPassword = String(parsed?.currentPassword ?? "");
                const newPassword = String(parsed?.newPassword ?? "");
                if (!currentPassword || !newPassword) return json(res, 400, { ok: false, error: "Eksik alan." });
                
                const user = await this.#users.getUser(session.username);
                if (!user || !verifyPassword(currentPassword, String(user.passwordHash ?? ""))) {
                    return json(res, 401, { ok: false, error: "Mevcut şifre yanlış." });
                }
                
                await this.#users.updateUser(session.username, { password: newPassword });
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/nav" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                const items = Array.from(this.#nav.values());
                const scope = (u.searchParams.get("scope") === "admin" ? "admin" : "app") as "admin" | "app";
                const scoped = items.filter(i => (i.scope ?? "app") === scope);
                const filtered = scoped.filter(i => !i.permission || this.hasPermission(session.roles, session.customPermissions, i.permission));
                return json(res, 200, { ok: true, items: filtered });
            }

            if (u.pathname === "/api/view" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                let viewPath = u.searchParams.get("path");
                if (!viewPath) return json(res, 400, { ok: false });
                
                if (!viewPath.startsWith('/')) viewPath = '/' + viewPath;
                
                const handler = this.#views.get(viewPath);
                if (handler) {
                    try {
                        const htmlContent = await handler(req, ctx);
                        return json(res, 200, { ok: true, html: htmlContent });
                    } catch (e) {
                        return json(res, 500, { ok: false, error: "View rendering failed" });
                    }
                }
                
                return json(res, 404, { ok: false, error: "View not found" });
            }

            if (u.pathname === "/api/chat/history" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "chat.view")) return json(res, 403, { ok: false });
                
                const offset = Math.max(0, parseInt(u.searchParams.get("offset") || "0", 10));
                const limit = Math.max(1, Math.min(100, parseInt(u.searchParams.get("limit") || "50", 10)));
                
                const total = this.#chat.length;
                const end = Math.max(0, total - offset);
                const start = Math.max(0, end - limit);
                
                const messages = this.#chat.slice(start, end);
                return json(res, 200, { ok: true, messages });
            }

            if (u.pathname === "/api/chat/stream" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "chat.view")) return json(res, 403, { ok: false });
                res.writeHead(200, {
                    "content-type": "text/event-stream; charset=utf-8",
                    "cache-control": "no-cache, no-transform, no-store, must-revalidate",
                    "x-accel-buffering": "no", // Disable buffering in Nginx/proxies
                    connection: "keep-alive",
                });
                // Send immediate retry and comment to keep-alive and bypass initial buffering
                res.write("retry: 1000\n\n");
                this.#sse.add(res);
                req.on("close", () => {
                    this.#sse.delete(res);
                });
                return;
            }

            if (u.pathname === "/api/chat" && method === "POST") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "chat.send")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                
                // Frontend 'text', Python script 'message' gönderebilir
                const rawText = String(parsed?.text || parsed?.message || "");
                const txt = sanitizeText(rawText);
                
                if (!txt) return json(res, 400, { ok: false });

                if (txt.startsWith("/")) {
                    if (!this.hasPermission(session.roles, session.customPermissions, "chat.command.slash")) return json(res, 403, { ok: false, error: "Slash komutu kullanma izniniz yok." });
                } else if (txt.startsWith("!")) {
                    if (!this.hasPermission(session.roles, session.customPermissions, "chat.command.client")) return json(res, 403, { ok: false, error: "Client komutu kullanma izniniz yok." });
                }

                const bot = this.#client.getBot?.();
                if (bot?.chat) {
                    if (txt.startsWith("/")) {
                        bot.chat(txt);
                    } else if (txt.startsWith("!")) {
                        // Eğer client komutuysa (örneğin !modules) bunu direkt Minecraft chatine yollamayalım, 
                        // kendi içimizde sender aracılığıyla işletelim.
                        const cmdManager = this.#client.getCommandManager?.();
                        const sender = this.#client.getConsoleCommandSender?.();
                        if (cmdManager && sender) {
                            const args = txt.slice(1).trim().split(/\s+/);
                            const cmdName = args.shift()?.toLowerCase();
                            if (cmdName) {
                                const cmd = cmdManager.get(cmdName);
                                if (cmd) {
                                    cmd.run(sender, args);
                                    return json(res, 200, { ok: true, note: "Komut çalıştırıldı." });
                                } else {
                                    return json(res, 404, { ok: false, error: "Bilinmeyen komut." });
                                }
                            }
                        }
                    } else {
                        bot.chat(txt);
                    }
                }
                
                // Input is no longer manually pushed here; it will be received via bot.on('message') from the server
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/chat/autocomplete" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                
                const q = u.searchParams.get("q") || "";
                let matches: string[] = [];

                if (q.startsWith("/")) {
                    if (this.hasPermission(session.roles, session.customPermissions, "chat.command.slash")) {
                        const bot = this.#client.getBot?.();
                        if (bot && typeof bot.tabComplete === "function") {
                            try {
                                const suggestions = await bot.tabComplete(q, true, false);
                                matches = suggestions.map((s: any) => typeof s === 'string' ? s : s.match);
                            } catch (e) {}
                        }
                    }
                } else if (q.startsWith("!")) {
                    if (this.hasPermission(session.roles, session.customPermissions, "chat.command.client")) {
                        const cmds = this.#client.getCommandManager?.()?.commands;
                        if (cmds) {
                            const search = q.slice(1).toLowerCase();
                            matches = Array.from(cmds.keys())
                                .filter((name: unknown) => typeof name === "string" && name.startsWith(search))
                                .map((name: unknown) => "!" + name);
                        }
                    }
                }
                
                return json(res, 200, { ok: true, matches });
            }

            if (u.pathname === "/api/modules" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "modules.view")) return json(res, 403, { ok: false });
                const modules = this.#client.getModuleManager().getModules();
                const list = Array.from(modules.entries()).map(([name, mod]: any) => ({
                    name,
                    enabled: mod.getEnabled(),
                    version: mod.getModuleManifest()?.getVersion?.() ?? ""
                })).sort((a: any, b: any) => a.name.localeCompare(b.name));
                return json(res, 200, { ok: true, modules: list });
            }

            if (u.pathname === "/api/modules/toggle" && method === "POST") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "modules.manage")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const name = String(parsed?.name ?? "");
                if (!name) return json(res, 400, { ok: false });
                const modules = this.#client.getModuleManager().getModules();
                const mod = modules.get(name);
                if (!mod) return json(res, 404, { ok: false });
                const next = typeof parsed?.enabled === "boolean" ? Boolean(parsed.enabled) : !mod.getEnabled();
                mod.setEnabled(next);
                const cfg = Xady.settings.getConfig() as any;
                const disabled: string[] = Array.isArray(cfg?.modules?.disabled) ? cfg.modules.disabled.map(String) : [];
                const set = new Set(disabled);
                if (next) set.delete(name);
                else set.add(name);
                Xady.settings.set("modules.disabled", Array.from(set).sort((a, b) => a.localeCompare(b)));
                return json(res, 200, { ok: true, enabled: mod.getEnabled() });
            }

            if (u.pathname === "/api/settings" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "settings.view")) return json(res, 403, { ok: false });
                const cfg = Xady.settings.getConfig() as any;
                const out = {
                    bot: cfg.bot,
                    cli: cfg.cli,
                    web: cfg.web
                };
                return json(res, 200, { ok: true, config: out });
            }

            if (u.pathname === "/api/settings" && method === "PUT") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "settings.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const updates = Array.isArray(parsed?.updates) ? parsed.updates : [];
                const allowed = new Set([
                    "bot.username",
                    "bot.host",
                    "bot.port",
                    "bot.version",
                    "bot.reconnectDelay",
                    "bot.maxReconnectAttempts",
                    "cli.prompt",
                    "web.enabled",
                    "web.bindHost",
                    "web.port"
                ]);
                for (const u of updates) {
                    const keyPath = String(u?.keyPath ?? "");
                    if (!allowed.has(keyPath)) continue;
                    Xady.settings.set(keyPath, u?.value);
                }
                return json(res, 200, { ok: true, note: "Bazı ayarlar için yeniden başlatma gerekebilir." });
            }

            if (u.pathname === "/api/admin/users" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.users.read")) return json(res, 403, { ok: false });
                const out = await this.#users.listUsers();
                return json(res, 200, { ok: true, users: out });
            }

            if (u.pathname === "/api/admin/users" && method === "POST") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.users.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const username = String(parsed?.username ?? "").trim();
                const password = String(parsed?.password ?? "");
                const roles = Array.isArray(parsed?.roles) ? parsed.roles.map(String) : [];
                if (!username || !password) return json(res, 400, { ok: false });
                const exists = await this.#users.getUser(username);
                if (exists) return json(res, 409, { ok: false });
                await this.#users.createUser(username, password, roles);
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/admin/users" && method === "PUT") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.users.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const username = String(parsed?.username ?? "").trim();
                if (!username) return json(res, 400, { ok: false });
                
                const password = typeof parsed?.password === "string" ? String(parsed.password) : undefined;
                const roles = Array.isArray(parsed?.roles) ? parsed.roles.map(String) : undefined;
                const bannedUntil = parsed?.bannedUntil !== undefined ? (parsed.bannedUntil === null ? null : Number(parsed.bannedUntil)) : undefined;
                const banReason = parsed?.banReason !== undefined ? (parsed.banReason === null ? null : String(parsed.banReason)) : undefined;
                const customPermissions = Array.isArray(parsed?.customPermissions) ? parsed.customPermissions.map(String) : undefined;
                
                await this.#users.updateUser(username, { password, roles, bannedUntil, banReason, customPermissions });
                
                // If banned or updated, refresh sessions
                if (bannedUntil && (bannedUntil === -1 || bannedUntil > Date.now())) {
                    await this.#sessions.kickUser(username);
                } else {
                    await this.#sessions.updateUserSessions(username, { roles, customPermissions });
                }
                
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/admin/users" && method === "DELETE") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.users.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const username = String(parsed?.username ?? "").trim();
                if (!username) return json(res, 400, { ok: false });
                if (username.toLowerCase() === session.username.toLowerCase()) return json(res, 400, { ok: false, error: "Kendinizi silemezsiniz." });
                await this.#users.deleteUser(username);
                await this.#sessions.kickUser(username);
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/admin/roles" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.roles.read")) return json(res, 403, { ok: false });
                const cfg = Xady.settings.getConfig() as any;
                const roles = cfg?.auth?.roles ?? {};
                return json(res, 200, { ok: true, roles });
            }

            if (u.pathname === "/api/admin/roles" && method === "PUT") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.roles.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const roles = parsed?.roles ?? null;
                if (!roles || typeof roles !== "object") return json(res, 400, { ok: false });
                const cleaned: Record<string, { permissions: string[] }> = {};
                for (const [k, v] of Object.entries(roles)) {
                    const perms = Array.isArray((v as any)?.permissions) ? (v as any).permissions.map(String) : [];
                    cleaned[String(k)] = { permissions: uniqueBy(perms, p => p) };
                }
                Xady.settings.set("auth.roles", cleaned);
                return json(res, 200, { ok: true });
            }

            if (u.pathname === "/api/admin/apikeys" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.apikeys.read")) return json(res, 403, { ok: false });
                const pool = getDbPool();
                if (pool) {
                    const [rows] = await pool.query<any[]>("SELECT id, token_hash, description, permissions_json as permissions, created_at as createdAt FROM xady_api_keys ORDER BY id DESC");
                    const list = (Array.isArray(rows) ? rows : []).map((r: any) => {
                        let perms: string[] = [];
                        try { perms = JSON.parse(r.permissions); } catch {}
                        return { id: r.id, apiKey: r.token_hash, description: String(r.description || ""), permissions: perms, createdAt: Number(r.createdAt) };
                    });
                    return json(res, 200, { ok: true, keys: list });
                }
                return json(res, 500, { ok: false });
            }

            if (u.pathname === "/api/admin/apikeys" && method === "POST") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.apikeys.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const desc = String(parsed?.description ?? "").trim();
                const perms = Array.isArray(parsed?.permissions) ? parsed.permissions.map(String) : [];
                
                const { randomBytes } = require("crypto");
                const rawKey = "xady_" + randomBytes(24).toString("hex");
                
                const pool = getDbPool();
                if (pool) {
                    await pool.execute(
                        "INSERT INTO xady_api_keys (token_hash, description, permissions_json) VALUES (?, ?, ?)",
                        [rawKey, desc, JSON.stringify(perms)]
                    );
                    return json(res, 200, { ok: true, apiKey: rawKey });
                }
                return json(res, 500, { ok: false });
            }

            if (u.pathname === "/api/admin/apikeys" && method === "DELETE") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.apikeys.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const id = Number(parsed?.id);
                if (isNaN(id)) return json(res, 400, { ok: false });
                const pool = getDbPool();
                if (pool) {
                    await pool.execute("DELETE FROM xady_api_keys WHERE id=?", [id]);
                    return json(res, 200, { ok: true });
                }
                return json(res, 500, { ok: false });
            }

            if (u.pathname === "/api/admin/apikeys" && method === "PUT") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.apikeys.write")) return json(res, 403, { ok: false });
                const buf = await readBody(req, 64 * 1024);
                let parsed: any = {};
                try { parsed = JSON.parse(buf.toString("utf8")); } catch {}
                const id = Number(parsed?.id);
                if (isNaN(id)) return json(res, 400, { ok: false });
                
                const desc = String(parsed?.description ?? "").trim();
                const perms = Array.isArray(parsed?.permissions) ? parsed.permissions.map(String) : [];
                
                const pool = getDbPool();
                if (pool) {
                    await pool.execute("UPDATE xady_api_keys SET description=?, permissions_json=? WHERE id=?", [desc, JSON.stringify(perms), id]);
                    return json(res, 200, { ok: true });
                }
                return json(res, 500, { ok: false });
            }

            if (u.pathname === "/api/admin/permissions" && method === "GET") {
                if (!session) return json(res, 401, { ok: false });
                if (!this.hasPermission(session.roles, session.customPermissions, "admin.roles.read")) return json(res, 403, { ok: false });
                
                // Collect core permissions
                const corePerms = [
                    { id: "*", description: "Tüm İzinler (Tam Yetki)" },
                    { id: "dashboard.view", description: "Paneli Görüntüle" },
                    { id: "settings.view", description: "Ayarları Görüntüle" },
                    { id: "settings.write", description: "Ayarları Düzenle" },
                    { id: "chat.view", description: "Sohbeti Görüntüle" },
                    { id: "chat.send", description: "Sohbetten Mesaj Gönder" },
                    { id: "chat.command.slash", description: "Slash Komutları Kullanımı (/)" },
                    { id: "chat.command.client", description: "Client Komutları Kullanımı (!)" },
                    { id: "admin.view", description: "Admin Paneline Eriş" },
                    { id: "admin.users.read", description: "Kullanıcıları Görüntüle" },
                    { id: "admin.users.write", description: "Kullanıcıları Yönet" },
                    { id: "admin.roles.read", description: "Rolleri Görüntüle" },
                    { id: "admin.roles.write", description: "Rolleri Yönet" },
                    { id: "admin.apikeys.read", description: "API Key Görüntüle" },
                    { id: "admin.apikeys.write", description: "API Key Yönet" },
                    { id: "modules.view", description: "Modülleri Görüntüle" },
                    { id: "modules.manage", description: "Modülleri Yönet" }
                ];

                const dynamicPerms = Array.from(this.#permissions.values());
                const allPerms = [...corePerms, ...dynamicPerms];
                
                return json(res, 200, { ok: true, permissions: allPerms });
            }

            return text(res, 404, "not_found");
        } catch (e) {
            console.error("[WebPanel] HTTP handle error:", e);
            return json(res, 500, { ok: false, error: e instanceof Error ? e.message : String(e) });
        }
    }
}
