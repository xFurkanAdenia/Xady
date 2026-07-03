import fs from "fs";
import yaml from "yaml";
import path from "path";

export class FileConfiguration {
    private file: string;
    private data: Record<string, any>;

    constructor(file: string) {
        this.file = file;
        this.data = {};
    }

    load() {
        if (fs.existsSync(this.file)) {
            try {
                const content = fs.readFileSync(this.file, "utf8");
                this.data = yaml.parse(content) || {};
            } catch (e) {
                console.error(`[Configuration] Failed to load config ${this.file}:`, e);
                this.data = {};
            }
        }
    }

    save() {
        try {
            if (this.file) {
                fs.mkdirSync(path.dirname(this.file), { recursive: true });
                fs.writeFileSync(this.file, yaml.stringify(this.data));
            }
        } catch (e) {
            console.error(`[Configuration] Failed to save config ${this.file}:`, e);
        }
    }

    private getPath(pathStr: string): any {
        if (!pathStr) return this.data;
        const parts = pathStr.split(".");
        let current = this.data;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return current;
    }

    get(pathStr: string, def?: any): any {
        const val = this.getPath(pathStr);
        return val !== undefined ? val : def;
    }

    getString(pathStr: string, def?: string): string {
        const val = this.get(pathStr, def);
        return val !== undefined ? String(val) : (def as any);
    }

    getInt(pathStr: string, def?: number): number {
        const val = this.get(pathStr, def);
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? (def as any) : parsed;
    }

    getNumber(pathStr: string, def?: number): number {
        const val = this.get(pathStr, def);
        const parsed = parseFloat(val);
        return isNaN(parsed) ? (def as any) : parsed;
    }

    getBoolean(pathStr: string, def?: boolean): boolean {
        const val = this.get(pathStr, def);
        if (val === undefined) return def || false;
        return Boolean(val);
    }

    getList(pathStr: string, def?: any[]): any[] {
        const val = this.get(pathStr, def);
        return Array.isArray(val) ? val : (def || []);
    }

    getStringList(pathStr: string): string[] {
        const val = this.getList(pathStr);
        return val.map(v => String(v));
    }

    set(pathStr: string, value: any) {
        if (!pathStr) return;
        const parts = pathStr.split(".");
        const last = parts.pop()!;
        let current = this.data;
        
        for (const part of parts) {
            if (typeof current[part] !== "object" || current[part] === null) {
                current[part] = {};
            }
            current = current[part];
        }
        
        if (value === undefined) {
            delete current[last];
        } else {
            current[last] = value;
        }
    }

    contains(pathStr: string): boolean {
        return this.getPath(pathStr) !== undefined;
    }

    getKeys(deep: boolean = false): string[] {
        if (!deep) return Object.keys(this.data);
        
        const keys: string[] = [];
        const traverse = (obj: any, prefix: string) => {
            if (typeof obj !== "object" || obj === null) return;
            for (const key of Object.keys(obj)) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                keys.push(fullKey);
                traverse(obj[key], fullKey);
            }
        };
        traverse(this.data, "");
        return keys;
    }
}
