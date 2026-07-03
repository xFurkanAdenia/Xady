import { createPool, Pool } from "mysql2/promise";
import { hashPassword } from "./auth";

let globalPool: Pool | undefined;

export function getDbPool() {
    return globalPool;
}

export type UserRecord = { 
    username: string; 
    passwordHash: string; 
    roles: string[];
    bannedUntil?: number | null;
    banReason?: string | null;
    customPermissions?: string[];
};

export class UserStore {
    #ready?: Promise<void>;

    init() {
        this.#ready = this.#initInternal();
        return this.#ready;
    }

    async close() {
        try { await globalPool?.end(); } catch {}
        globalPool = undefined;
    }

    private getDbConfig() {
        const cfg = Xady.settings.getConfig() as any;
        const db = cfg?.auth?.db ?? {};
        return {
            enabled: Boolean(db?.enabled),
            host: String(db?.host ?? "127.0.0.1"),
            port: Number(db?.port ?? 3306),
            user: String(db?.user ?? "root"),
            password: String(db?.password ?? ""),
            database: String(db?.database ?? "xady"),
        };
    }

    async #initInternal() {
        const db = this.getDbConfig();
        if (!db.enabled) {
            return;
        }

        try {
            if (!globalPool) {
                globalPool = createPool({
                    host: db.host,
                    port: db.port,
                    user: db.user,
                    password: db.password,
                    database: db.database,
                    connectionLimit: 5,
                    enableKeepAlive: true,
                } as any);
            }

            await globalPool.execute(
                `CREATE TABLE IF NOT EXISTS xady_users (
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

            await globalPool.execute(
                `CREATE TABLE IF NOT EXISTS xady_sessions (
                    token VARCHAR(128) PRIMARY KEY,
                    username VARCHAR(64) NOT NULL,
                    roles_json TEXT NOT NULL,
                    custom_permissions_json TEXT NOT NULL,
                    csrf_token VARCHAR(128) NOT NULL,
                    created_at BIGINT NOT NULL,
                    last_seen BIGINT NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
            );

            await globalPool.execute(
                `CREATE TABLE IF NOT EXISTS xady_api_keys (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    token_hash VARCHAR(255) NOT NULL,
                    description TEXT DEFAULT NULL,
                    permissions_json TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
            );

            // Migration for xady_sessions csrf_token
            try {
                const [cols] = await globalPool.query<any[]>("SHOW COLUMNS FROM xady_sessions LIKE 'csrf_token'");
                if (cols.length === 0) {
                    await globalPool.execute("ALTER TABLE xady_sessions ADD COLUMN csrf_token VARCHAR(128) NOT NULL DEFAULT ''");
                }
            } catch (e) {
                console.error("Migration failed for xady_sessions:", e);
            }
            try {
                const [cols] = await globalPool.query<any[]>("SHOW COLUMNS FROM xady_users LIKE 'banned_until'");
                if (cols.length === 0) {
                    await globalPool.execute("ALTER TABLE xady_users ADD COLUMN banned_until BIGINT DEFAULT NULL");
                    await globalPool.execute("ALTER TABLE xady_users ADD COLUMN ban_reason TEXT DEFAULT NULL");
                    await globalPool.execute("ALTER TABLE xady_users ADD COLUMN custom_permissions_json TEXT DEFAULT NULL");
                }
            } catch (e) {
                console.error("Migration failed for xady_users:", e);
            }
        } catch (e) {
            try { await globalPool?.end(); } catch {}
            globalPool = undefined;
            console.error("WebPanel MySQL bağlantısı kurulamadı:", e);
        }
    }

    private async ready() {
        await this.#ready;
    }

    async getUser(username: string): Promise<UserRecord | null> {
        await this.ready();
        const db = this.getDbConfig();
        if (db.enabled && globalPool) {
            const [rows] = await globalPool.query<any[]>(
                "SELECT username, password_hash as passwordHash, roles_json as rolesJson, banned_until as bannedUntil, ban_reason as banReason, custom_permissions_json as customPermissionsJson FROM xady_users WHERE LOWER(username)=LOWER(?) LIMIT 1",
                [username]
            );
            const row = Array.isArray(rows) ? rows[0] : undefined;
            if (!row) return null;
            let roles: string[] = [];
            let customPermissions: string[] = [];
            try { roles = JSON.parse(String(row.rolesJson ?? "[]")); } catch {}
            try { customPermissions = JSON.parse(String(row.customPermissionsJson ?? "[]")); } catch {}
            return { 
                username: String(row.username), 
                passwordHash: String(row.passwordHash), 
                roles: Array.isArray(roles) ? roles.map(String) : [],
                bannedUntil: row.bannedUntil ? Number(row.bannedUntil) : null,
                banReason: row.banReason ? String(row.banReason) : null,
                customPermissions: Array.isArray(customPermissions) ? customPermissions.map(String) : []
            };
        }
        return null;
    }

    async listUsers(): Promise<Array<{ username: string; roles: string[]; bannedUntil?: number | null; banReason?: string | null; customPermissions?: string[] }>> {
        await this.ready();
        const db = this.getDbConfig();
        if (db.enabled && globalPool) {
            const [rows] = await globalPool.query<any[]>("SELECT username, roles_json as rolesJson, banned_until as bannedUntil, ban_reason as banReason, custom_permissions_json as customPermissionsJson FROM xady_users ORDER BY username ASC");
            return (Array.isArray(rows) ? rows : []).map((r: any) => {
                let roles: string[] = [];
                let customPermissions: string[] = [];
                try { roles = JSON.parse(String(r.rolesJson ?? "[]")); } catch {}
                try { customPermissions = JSON.parse(String(r.customPermissionsJson ?? "[]")); } catch {}
                return { 
                    username: String(r.username), 
                    roles: Array.isArray(roles) ? roles.map(String) : [],
                    bannedUntil: r.bannedUntil ? Number(r.bannedUntil) : null,
                    banReason: r.banReason ? String(r.banReason) : null,
                    customPermissions: Array.isArray(customPermissions) ? customPermissions.map(String) : []
                };
            });
        }
        return [];
    }

    async createUser(username: string, password: string, roles: string[]) {
        await this.ready();
        const db = this.getDbConfig();
        if (db.enabled && globalPool) {
            await globalPool.execute(
                "INSERT INTO xady_users (username, password_hash, roles_json) VALUES (?, ?, ?)",
                [username, hashPassword(password), JSON.stringify(roles)]
            );
            return;
        }
    }

    async deleteUser(username: string) {
        await this.ready();
        const db = this.getDbConfig();
        if (db.enabled && globalPool) {
            await globalPool.execute("DELETE FROM xady_users WHERE LOWER(username)=LOWER(?)", [username]);
        }
    }

    async updateUser(username: string, patch: { password?: string | null; roles?: string[] | null; bannedUntil?: number | null; banReason?: string | null; customPermissions?: string[] | null }) {
        await this.ready();
        const db = this.getDbConfig();
        if (db.enabled && globalPool) {
            const fields: string[] = [];
            const values: any[] = [];
            if (patch.password) {
                fields.push("password_hash=?");
                values.push(hashPassword(patch.password));
            }
            if (patch.roles !== undefined && patch.roles !== null) {
                fields.push("roles_json=?");
                values.push(JSON.stringify(patch.roles));
            }
            if (patch.bannedUntil !== undefined) {
                fields.push("banned_until=?");
                values.push(patch.bannedUntil === null ? null : patch.bannedUntil);
            }
            if (patch.banReason !== undefined) {
                fields.push("ban_reason=?");
                values.push(patch.banReason === null ? null : patch.banReason);
            }
            if (patch.customPermissions !== undefined && patch.customPermissions !== null) {
                fields.push("custom_permissions_json=?");
                values.push(JSON.stringify(patch.customPermissions));
            }
            if (fields.length === 0) return;
            values.push(username);
            await globalPool.execute(`UPDATE xady_users SET ${fields.join(", ")} WHERE LOWER(username)=LOWER(?)`, values);
            return;
        }
    }
}
