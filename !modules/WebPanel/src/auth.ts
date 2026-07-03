import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDbPool } from "./users";

export type Session = { username: string; roles: string[]; customPermissions: string[]; createdAt: number; csrfToken: string; isApiKey?: boolean; };

function toBase64Url(buf: Buffer) {
    return buf
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function fromBase64Url(s: string) {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return Buffer.from(b64, "base64");
}

export function hashPassword(password: string) {
    const salt = randomBytes(16);
    const key = scryptSync(password, salt, 64);
    return `scrypt$${toBase64Url(salt)}$${toBase64Url(key)}`;
}

export function verifyPassword(password: string, stored: string) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    if (parts[0] !== "scrypt") return false;
    const salt = fromBase64Url(parts[1] ?? "");
    const expected = fromBase64Url(parts[2] ?? "");
    const actual = scryptSync(password, salt, expected.length);
    if (actual.length !== expected.length) return false;
    return timingSafeEqual(actual, expected);
}

export class SessionStore {
    async create(username: string, roles: string[], customPermissions: string[] = []) {
        const token = toBase64Url(randomBytes(32));
        const csrfToken = toBase64Url(randomBytes(32));
        const pool = getDbPool();
        if (pool) {
            await pool.execute(
                "INSERT INTO xady_sessions (token, username, roles_json, custom_permissions_json, csrf_token, created_at, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [token, username, JSON.stringify(roles), JSON.stringify(customPermissions), csrfToken, Date.now(), Date.now()]
            );
        }
        return { token, csrfToken };
    }

    async updateUserSessions(username: string, updates: { roles?: string[]; customPermissions?: string[] }) {
        const pool = getDbPool();
        if (pool) {
            const fields: string[] = [];
            const values: any[] = [];
            if (updates.roles) {
                fields.push("roles_json=?");
                values.push(JSON.stringify(updates.roles));
            }
            if (updates.customPermissions) {
                fields.push("custom_permissions_json=?");
                values.push(JSON.stringify(updates.customPermissions));
            }
            if (fields.length === 0) return;
            values.push(username);
            await pool.execute(`UPDATE xady_sessions SET ${fields.join(", ")} WHERE LOWER(username)=LOWER(?)`, values);
        }
    }

    async kickUser(username: string) {
        const pool = getDbPool();
        if (pool) {
            await pool.execute("DELETE FROM xady_sessions WHERE LOWER(username)=LOWER(?)", [username]);
        }
    }

    async get(token: string | undefined): Promise<Session | null> {
        if (!token) return null;
        const pool = getDbPool();
        if (pool) {
            const [rows] = await pool.query<any[]>("SELECT username, roles_json, custom_permissions_json, csrf_token, created_at FROM xady_sessions WHERE token=? LIMIT 1", [token]);
            const row = Array.isArray(rows) ? rows[0] : undefined;
            if (!row) return null;
            
            // Update last_seen async
            pool.execute("UPDATE xady_sessions SET last_seen=? WHERE token=?", [Date.now(), token]).catch(() => {});
            
            let roles: string[] = [];
            let customPerms: string[] = [];
            try { roles = JSON.parse(row.roles_json); } catch {}
            try { customPerms = JSON.parse(row.custom_permissions_json); } catch {}
            
            return {
                username: row.username,
                roles,
                customPermissions: customPerms,
                createdAt: Number(row.created_at),
                csrfToken: String(row.csrf_token)
            };
        }
        return null;
    }

    async delete(token: string | undefined) {
        if (!token) return;
        const pool = getDbPool();
        if (pool) {
            await pool.execute("DELETE FROM xady_sessions WHERE token=?", [token]);
        }
    }

    async clear() {
        const pool = getDbPool();
        if (pool) {
            await pool.execute("TRUNCATE TABLE xady_sessions");
        }
    }
}

export function sessionCookie(token: string) {
    const parts = [
        `xady_session=${encodeURIComponent(token)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
    ];
    return parts.join("; ");
}

export function clearSessionCookie() {
    return "xady_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax";
}

