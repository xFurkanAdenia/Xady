import { readFile } from "node:fs/promises";
import path from "node:path";

type Asset = { contentType: string; body: Buffer };

export class AssetStore {
    #cache = new Map<string, Asset>();
    #roots: string[];

    constructor() {
        this.#roots = [
            path.join(__dirname, "assets"),
            path.join(process.cwd(), "src", "modules", "WebPanel", "assets")
        ];
    }

    private async loadFromRoots(relPath: string) {
        // Try getting from package resource (ZIP)
        try {
            const WebPanelModule = require("./index").default;
            const instance = WebPanelModule.getInstance();
            if (instance) {
                // First try to load as asset
                const buf = instance.getResource("src/assets/" + relPath);
                if (buf) return buf;

                // Fall back to docs folder (e.g. docs/api.html)
                const docBuf = instance.getResource("src/docs/" + relPath);
                if (docBuf) return docBuf;
            }
        } catch {}

        let lastErr: unknown = null;
        for (const root of this.#roots) {
            try {
                const full = path.join(root, relPath);
                const body = await readFile(full);
                return body;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr ?? new Error("asset_not_found");
    }

    async get(name: string): Promise<Asset | null> {
        const key = name.replace(/\\/g, "/");
        const cached = this.#cache.get(key);
        if (cached) return cached;

        const ext = path.extname(key).toLowerCase();
        const contentType =
            ext === ".html" ? "text/html; charset=utf-8" :
                ext === ".css" ? "text/css; charset=utf-8" :
                    ext === ".js" ? "text/javascript; charset=utf-8" :
                        "application/octet-stream";

        try {
            const body = await this.loadFromRoots(key);
            const asset = { contentType, body };
            this.#cache.set(key, asset);
            return asset;
        } catch {
            return null;
        }
    }
}

