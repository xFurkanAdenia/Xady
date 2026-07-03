import type { IncomingMessage, ServerResponse } from "node:http";
import WebPosModule from ".";
import PosPayment, { POS_PAYMENT_STATUS } from "./models/PosPayment";

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
            if (!u.pathname.startsWith("/api/pos") && u.pathname !== "/api/pos/config" && !u.pathname.startsWith("/api/pos")) {
                return false;
            }
            if (!u.pathname.startsWith("/api/pos")) return false;

            const session = ctx?.session;
            const hasPerm = ctx?.hasPerm;

            // ── GET /api/pos/payments ── Aktif ödemeleri listele
            if (u.pathname === "/api/pos/payments" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.view")) return (json(res, 403, { ok: false, error: "Yetersiz yetki." }), true);

                const instance = WebPosModule.getInstance();
                const active = instance.getPosManager().getActivePayments().map(p => p.toJSON());
                json(res, 200, { ok: true, payments: active });
                return true;
            }

            // ── GET /api/pos/history ── Tamamlanan ödemeleri listele
            if (u.pathname === "/api/pos/history" && method === "GET") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.view")) return (json(res, 403, { ok: false, error: "Yetersiz yetki." }), true);

                const instance = WebPosModule.getInstance();
                const completed = instance.getPosManager().getCompletedPayments().map(p => p.toJSON());
                json(res, 200, { ok: true, payments: completed });
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

                if (!username) return (json(res, 400, { ok: false, error: "Oyuncu adı gerekli." }), true);
                if (isNaN(amount) || amount <= 0) return (json(res, 400, { ok: false, error: "Geçerli bir tutar giriniz." }), true);

                const instance = WebPosModule.getInstance();
                const manager = instance.getPosManager();

                // Aynı oyuncuya ait aktif ödeme var mı?
                if (manager.getPaymentByUser(username)) {
                    return (json(res, 409, { ok: false, error: `${username} adlı oyuncunun zaten aktif bir ödemesi var.` }), true);
                }

                const payment = manager.createPayment({
                    username,
                    amount,
                    description,
                    createdBy: session.username,
                });

                json(res, 201, { ok: true, payment: payment.toJSON() });
                return true;
            }

            // ── DELETE /api/pos/payments/:id ── Ödemeyi iptal et
            if (u.pathname.startsWith("/api/pos/payments/") && method === "DELETE") {
                if (!session) return (json(res, 401, { ok: false, error: "Giriş yapınız." }), true);
                if (!hasPerm?.("pos.cancel")) return (json(res, 403, { ok: false, error: "Ödeme iptal etme yetkiniz yok." }), true);

                const id = u.pathname.replace("/api/pos/payments/", "").trim();
                if (!id) return (json(res, 400, { ok: false, error: "ID gerekli." }), true);

                const instance = WebPosModule.getInstance();
                const ok = instance.getPosManager().cancelPayment(id);
                if (!ok) return (json(res, 404, { ok: false, error: "Ödeme bulunamadı veya zaten tamamlandı." }), true);

                json(res, 200, { ok: true });
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
