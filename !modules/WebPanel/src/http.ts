import type { IncomingMessage, ServerResponse } from "node:http";

export function sendBuffer(
    res: ServerResponse,
    status: number,
    body: Buffer,
    contentType: string,
    headers?: Record<string, string>
) {
    res.writeHead(status, {
        "content-type": contentType,
        "content-length": String(body.length),
        ...(headers ?? {})
    });
    res.end(body);
}

export function json(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string>) {
    const payload = Buffer.from(JSON.stringify(body));
    sendBuffer(res, status, payload, "application/json; charset=utf-8", headers);
}

export function text(res: ServerResponse, status: number, body: string, headers?: Record<string, string>) {
    const payload = Buffer.from(body, "utf8");
    sendBuffer(res, status, payload, "text/plain; charset=utf-8", headers);
}

export function html(res: ServerResponse, status: number, body: string, headers?: Record<string, string>) {
    const payload = Buffer.from(body, "utf8");
    sendBuffer(res, status, payload, "text/html; charset=utf-8", headers);
}

export function redirect(res: ServerResponse, location: string) {
    res.writeHead(302, { location });
    res.end();
}

export function readBody(req: IncomingMessage, maxBytes: number) {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];
        let total = 0;
        req.on("data", (c: Buffer) => {
            total += c.length;
            if (total > maxBytes) {
                reject(new Error("payload_too_large"));
                req.destroy();
                return;
            }
            chunks.push(c);
        });
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) return {};
    const out: Record<string, string> = {};
    for (const part of cookieHeader.split(";")) {
        const idx = part.indexOf("=");
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1).trim();
        if (!k) continue;
        out[k] = decodeURIComponent(v);
    }
    return out;
}

