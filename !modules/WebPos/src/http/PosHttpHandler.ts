import type { IncomingMessage, ServerResponse } from "node:http";
import WebPosModule from "..";

type HttpHandler = (req: IncomingMessage, res: ServerResponse, ctx?: any) => boolean | Promise<boolean>;

function json(res: ServerResponse, status: number, data: any) {
    const body = JSON.stringify(data);
    res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
    });
    res.end(body);
}

async function readBody(req: IncomingMessage, maxBytes = 64 * 1024): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let total = 0;
        req.on("data", (chunk: Buffer) => {
            total += chunk.length;
            if (total > maxBytes) {
                reject(new Error("Body too large"));
                return;
            }
            chunks.push(chunk);
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

/**
 * WebPos HTTP API Handler + SSE push sistemi
 */
export default class PosHttpHandler {
    #sse = new Set<ServerResponse>();

    getHandler(): HttpHandler {
        return async (req: IncomingMessage, res: ServerResponse, ctx?: any) => {
            const u = new URL(req.url || "/", "http://localhost");
            const method = req.method?.toUpperCase() ?? "GET";

            // Tüm /api/pos/* yolları auth gerektirir
            if (!u.pathname.startsWith("/api/pos")) return false;

            const session = ctx?.session;
            const hasPerm = ctx?.hasPerm;

            // ── GET /api/pos/payments ── Aktif ödemeleri listele (kullanıcıya özel)
            if (u.pathname === "/api/pos/payments" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.view")) return (json(res, 403, { ok: false, error: "Yetersiz yetki." }), true);

                const instance = WebPosModule.getInstance();
                const allActive = instance.getPosManager().getActivePayments();
                
                // Sadece bu kullanıcının oluşturduğu ödemeleri filtrele
                const userPayments = allActive
                    .filter(p => p.getCreatedBy() === session.username)
                    .map(p => p.toJSON());
                
                json(res, 200, { ok: true, payments: userPayments });
                return true;
            }

            // ── GET /api/pos/history ── Tamamlanan ödemeleri listele (kullanıcıya özel)
            if (u.pathname === "/api/pos/history" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.view")) return (json(res, 403, { ok: false, error: "Yetersiz yetki." }), true);

                const instance = WebPosModule.getInstance();
                const allCompleted = instance.getPosManager().getCompletedPayments();
                
                // Sadece bu kullanıcının oluşturduğu ödemeleri filtrele
                const userPayments = allCompleted
                    .filter(p => p.getCreatedBy() === session.username)
                    .map(p => p.toJSON());
                
                json(res, 200, { ok: true, payments: userPayments });
                return true;
            }

            // ── POST /api/pos/payments ── Yeni ödeme oluştur
            if (u.pathname === "/api/pos/payments" && method === "POST") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.create")) return (json(res, 403, { ok: false, error: "Ödeme oluşturma yetkiniz yok." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const username = String(body.username ?? "").trim();
                const amount = parseFloat(body.amount);
                const description = String(body.description ?? "").trim().slice(0, 200);
                const productId = body.productId ? String(body.productId).trim() : undefined;

                if (!username) return (json(res, 400, { ok: false, error: "Oyuncu adı gerekli." }), true);
                if (isNaN(amount) || amount <= 0) return (json(res, 400, { ok: false, error: "Geçerli bir tutar giriniz." }), true);

                const instance = WebPosModule.getInstance();
                const manager = instance.getPosManager();

                // Aynı oyuncuya ait aktif ödeme sayısını kontrol et
                const existingCount = manager.getActivePaymentsByUser(username).length;

                const payment = manager.createPayment({
                    username,
                    amount,
                    description,
                    createdBy: session.username,
                    productId,
                });

                const message = existingCount > 0 
                    ? `Ödeme oluşturuldu. Bu oyuncuya toplam ${existingCount + 1} aktif ödeme var.`
                    : `Ödeme oluşturuldu.`;

                json(res, 201, { ok: true, payment: payment.toJSON(), message });
                return true;
            }

            // ── DELETE /api/pos/payments/:id ── Ödemeyi iptal et
            if (u.pathname.startsWith("/api/pos/payments/") && method === "DELETE") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.cancel")) return (json(res, 403, { ok: false, error: "Ödeme iptal etme yetkiniz yok." }), true);

                const id = u.pathname.replace("/api/pos/payments/", "").split('/')[0].trim();
                if (!id) return (json(res, 400, { ok: false, error: "ID gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const ok = instance.getPosManager().cancelPayment(id);
                if (!ok) return (json(res, 404, { ok: false, error: "Ödeme bulunamadı veya zaten tamamlandı." }), true);

                json(res, 200, { ok: true });
                return true;
            }

            // ── POST /api/pos/payments/:id/refund ── Ödeme iadesi yap
            if (u.pathname.match(/^\/api\/pos\/payments\/[^/]+\/refund$/) && method === "POST") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.cancel")) return (json(res, 403, { ok: false, error: "İade yapma yetkiniz yok." }), true);

                const id = u.pathname.split('/')[4];
                if (!id) return (json(res, 400, { ok: false, error: "ID gerekli." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const amount = parseFloat(body.amount);
                const isPercentage = Boolean(body.isPercentage);
                const reason = String(body.reason || "").trim();

                if (isNaN(amount) || amount <= 0) {
                    return (json(res, 400, { ok: false, error: "Geçerli bir tutar giriniz." }), true);
                }

                const instance = WebPosModule.getInstance();
                const bot = instance.getClient().getBot();
                const result = instance.getPosManager().refundPayment(id, amount, isPercentage, session.username, reason, bot);

                if (result.success) {
                    json(res, 200, { ok: true, refundAmount: result.refundAmount });
                } else {
                    json(res, 400, { ok: false, error: result.error });
                }
                return true;
            }

            // ── GET /api/pos/stream ── SSE stream (real-time ödeme olayları)
            if (u.pathname === "/api/pos/stream" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.view")) return (json(res, 403, { ok: false, error: "Yetersiz yetki." }), true);

                res.writeHead(200, {
                    "content-type": "text/event-stream; charset=utf-8",
                    "cache-control": "no-cache, no-transform, no-store",
                    "x-accel-buffering": "no",
                    connection: "keep-alive",
                });
                res.write("retry: 2000\n\n");
                this.#sse.add(res);

                req.on("close", () => {
                    this.#sse.delete(res);
                });
                return true;
            }

            // ── GET /api/pos/config ── Mevcut config'i getir
            if (u.pathname === "/api/pos/config" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.config")) return (json(res, 403, { ok: false, error: "Config görüntüleme yetkiniz yok." }), true);

                const instance = WebPosModule.getInstance();
                const cfg = instance.getFileConfig();
                json(res, 200, { ok: true, config: cfg });
                return true;
            }

            // ── POST /api/pos/config ── Config'i güncelle ve reload et
            if (u.pathname === "/api/pos/config" && method === "POST") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.config")) return (json(res, 403, { ok: false, error: "Config güncelleme yetkiniz yok." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const instance = WebPosModule.getInstance();
                try {
                    instance.updateAndReloadConfig(body);
                    json(res, 200, { ok: true, message: "Config güncellendi ve yeniden yüklendi." });
                } catch (e: any) {
                    json(res, 400, { ok: false, error: e?.message || "Config güncellenirken hata oluştu." });
                }
                return true;
            }

            // ── GET /api/pos/balance ── Kullanıcının bakiyesini getir
            if (u.pathname === "/api/pos/balance" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                let user = storage.getUser(session.username);
                
                if (!user) {
                    user = storage.createUser(session.username);
                }

                json(res, 200, { ok: true, balance: user.getBalance() });
                return true;
            }

            // ── POST /api/pos/withdraw ── Bakiyeden para çek
            if (u.pathname === "/api/pos/withdraw" && method === "POST") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const minecraftUsername = String(body.minecraftUsername ?? "").trim();
                const amount = parseFloat(body.amount);

                if (!minecraftUsername) return (json(res, 400, { ok: false, error: "Minecraft oyuncu adı gerekli." }), true);
                if (isNaN(amount) || amount <= 0) return (json(res, 400, { ok: false, error: "Geçerli bir tutar giriniz." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                const user = storage.getUser(session.username);

                if (!user) {
                    return (json(res, 404, { ok: false, error: "Kullanıcı bulunamadı." }), true);
                }

                if (user.getBalance() < amount) {
                    return (json(res, 400, { ok: false, error: `Yetersiz bakiye. Mevcut: ${amount}⛁` }), true);
                }

                // Bakiyeden düş
                if (!user.subtractBalance(amount)) {
                    return (json(res, 400, { ok: false, error: "Yetersiz bakiye." }), true);
                }
                storage.saveUser(user);

                // Oyun içinde para gönder
                const bot = instance.getClient().getBot();
                const config = instance.getPosManager().getConfig();
                const cmd = config.payCommand
                    .replace("{username}", minecraftUsername)
                    .replace("{amount}", String(amount));
                
                bot?.chat(cmd);
                bot?.chat(cmd);

                json(res, 200, { ok: true, newBalance: user.getBalance() });
                return true;
            }

            // ── GET /api/pos/functions ── Kullan İcabir fonksiyonları listele
            if (u.pathname === "/api/pos/functions" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                const instance = WebPosModule.getInstance();
                const registry = instance.getFunctionRegistry();
                
                // Kullanıcının izinlerine göre filtrele
                const userPermissions = ctx?.permissions || [];
                const functions = registry.getFunctionsForUser(userPermissions);

                json(res, 200, { ok: true, functions: functions.map(f => f.toJSON()) });
                return true;
            }

            // ── GET /api/pos/products ── Kullanıcının ürünlerini listele
            if (u.pathname === "/api/pos/products" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                let user = storage.getUser(session.username);
                
                if (!user) {
                    user = storage.createUser(session.username);
                }

                json(res, 200, { ok: true, products: user.getProducts() });
                return true;
            }

            // ── POST /api/pos/products ── Yeni ürün ekle
            if (u.pathname === "/api/pos/products" && method === "POST") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const name = String(body.name ?? "").trim();
                const price = parseFloat(body.price);
                const description = String(body.description ?? "").trim();
                const actions = Array.isArray(body.actions) ? body.actions : [];

                if (!name) return (json(res, 400, { ok: false, error: "Ürün adı gerekli." }), true);
                if (isNaN(price) || price <= 0) return (json(res, 400, { ok: false, error: "Geçerli bir fiyat giriniz." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                let user = storage.getUser(session.username);
                
                if (!user) {
                    user = storage.createUser(session.username);
                }

                const product = {
                    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name,
                    price,
                    description: description || undefined,
                    actions: actions.map((a: any) => ({
                        id: a.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: a.type === "command" ? "command" : "function",
                        value: String(a.value || ""),
                    })),
                    enabled: true,
                };

                user.addProduct(product);
                storage.saveUser(user);

                json(res, 201, { ok: true, product });
                return true;
            }

            // ── PUT /api/pos/products/:id ── Ürün güncelle
            if (u.pathname.match(/^\/api\/pos\/products\/[^/]+$/) && method === "PUT") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                const productId = u.pathname.split('/')[4];
                if (!productId) return (json(res, 400, { ok: false, error: "ID gerekli." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                const user = storage.getUser(session.username);
                
                if (!user) {
                    return (json(res, 404, { ok: false, error: "Kullanıcı bulunamadı." }), true);
                }

                const updates: any = {};
                if (body.name !== undefined) updates.name = String(body.name).trim();
                if (body.price !== undefined) updates.price = parseFloat(body.price);
                if (body.description !== undefined) updates.description = String(body.description).trim();
                if (body.enabled !== undefined) updates.enabled = Boolean(body.enabled);
                if (body.actions !== undefined) {
                    updates.actions = Array.isArray(body.actions) ? body.actions.map((a: any) => ({
                        id: a.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: a.type === "command" ? "command" : "function",
                        value: String(a.value || ""),
                    })) : [];
                }

                const ok = user.updateProduct(productId, updates);
                if (!ok) {
                    return (json(res, 404, { ok: false, error: "Ürün bulunamadı." }), true);
                }

                storage.saveUser(user);
                json(res, 200, { ok: true, product: user.getProduct(productId) });
                return true;
            }

            // ── DELETE /api/pos/products/:id ── Ürün sil
            if (u.pathname.match(/^\/api\/pos\/products\/[^/]+$/) && method === "DELETE") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);

                const productId = u.pathname.split('/')[4];
                if (!productId) return (json(res, 400, { ok: false, error: "ID gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                const user = storage.getUser(session.username);
                
                if (!user) {
                    return (json(res, 404, { ok: false, error: "Kullanıcı bulunamadı." }), true);
                }

                const ok = user.removeProduct(productId);
                if (!ok) {
                    return (json(res, 404, { ok: false, error: "Ürün bulunamadı." }), true);
                }

                storage.saveUser(user);
                json(res, 200, { ok: true });
                return true;
            }

            // ── ADMIN ENDPOINTS ──────────────────────────────────────────

            // ── GET /api/pos/admin/users ── Tüm kullanıcıları listele
            if (u.pathname === "/api/pos/admin/users" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.admin")) return (json(res, 403, { ok: false, error: "Admin yetkisi gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                const users = storage.getAllUsers().map(u => ({
                    username: u.getUsername(),
                    balance: u.getBalance(),
                    productCount: u.getProducts().length,
                    createdAt: u.getCreatedAt(),
                }));

                json(res, 200, { ok: true, users });
                return true;
            }

            // ── GET /api/pos/admin/users/:username ── Kullanıcı detayı
            if (u.pathname.match(/^\/api\/pos\/admin\/users\/[^/]+$/) && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.admin")) return (json(res, 403, { ok: false, error: "Admin yetkisi gerekli." }), true);

                const username = u.pathname.split('/')[5];
                if (!username) return (json(res, 400, { ok: false, error: "Kullanıcı adı gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                const user = storage.getUser(username);

                if (!user) {
                    return (json(res, 404, { ok: false, error: "Kullanıcı bulunamadı." }), true);
                }

                json(res, 200, { ok: true, user: user.toJSON() });
                return true;
            }

            // ── PUT /api/pos/admin/users/:username/balance ── Bakiye düzenle
            if (u.pathname.match(/^\/api\/pos\/admin\/users\/[^/]+\/balance$/) && method === "PUT") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.admin")) return (json(res, 403, { ok: false, error: "Admin yetkisi gerekli." }), true);

                const username = u.pathname.split('/')[5];
                if (!username) return (json(res, 400, { ok: false, error: "Kullanıcı adı gerekli." }), true);

                let body: any = {};
                try {
                    const buf = await readBody(req);
                    body = JSON.parse(buf.toString("utf8"));
                } catch {
                    return (json(res, 400, { ok: false, error: "Geçersiz JSON." }), true);
                }

                const action = body.action; // "set" | "add" | "subtract"
                const amount = parseFloat(body.amount);

                if (!action || !["set", "add", "subtract"].includes(action)) {
                    return (json(res, 400, { ok: false, error: "Geçersiz action. (set, add, subtract)" }), true);
                }

                if (isNaN(amount) || amount < 0) {
                    return (json(res, 400, { ok: false, error: "Geçerli bir miktar giriniz." }), true);
                }

                const instance = WebPosModule.getInstance();
                const storage = instance.getPosManager().getStorage();
                let user = storage.getUser(username);

                if (!user) {
                    user = storage.createUser(username);
                }

                if (action === "set") {
                    user.setBalance(amount);
                } else if (action === "add") {
                    user.addBalance(amount);
                } else if (action === "subtract") {
                    if (!user.subtractBalance(amount)) {
                        return (json(res, 400, { ok: false, error: "Yetersiz bakiye." }), true);
                    }
                }

                storage.saveUser(user);
                json(res, 200, { ok: true, balance: user.getBalance() });
                return true;
            }

            // ── GET /api/pos/admin/payments ── Tüm ödemeleri listele (pagination)
            if (u.pathname === "/api/pos/admin/payments" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.admin")) return (json(res, 403, { ok: false, error: "Admin yetkisi gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const page = parseInt(u.searchParams.get("page") || "1");
                const limit = parseInt(u.searchParams.get("limit") || "20");
                const search = u.searchParams.get("search") || "";
                const username = u.searchParams.get("username") || "";

                let allPayments = instance.getPosManager().getCompletedPayments();

                // Filtrele
                if (username) {
                    allPayments = allPayments.filter(p => p.getCreatedBy() === username);
                } else if (search) {
                    const searchLower = search.toLowerCase();
                    allPayments = allPayments.filter(p => 
                        p.getUsername().toLowerCase().includes(searchLower) ||
                        p.getCreatedBy().toLowerCase().includes(searchLower) ||
                        p.getDescription().toLowerCase().includes(searchLower)
                    );
                }

                const total = allPayments.length;
                const start = (page - 1) * limit;
                const end = start + limit;
                const payments = allPayments.slice(start, end).map(p => p.toJSON());

                json(res, 200, { 
                    ok: true, 
                    payments, 
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit)
                    }
                });
                return true;
            }

            return false;
        };
    }

    /**
     * SSE ile tüm bağlı istemcilere bir olay yayınlar
     */
    push(event: string, data: any) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const res of this.#sse) {
            try {
                res.write(payload);
                if (typeof (res as any).flush === "function") (res as any).flush();
            } catch {
                this.#sse.delete(res);
            }
        }
    }

    destroySse() {
        for (const res of this.#sse) {
            try { res.end(); } catch {}
        }
        this.#sse.clear();
    }
}
