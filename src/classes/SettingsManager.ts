import { existsSync, readFileSync, writeFileSync } from "node:fs";
import chalk from "chalk";
import AppDataManager from "../utils/appdata";
import { activeModuleStorage } from "../context";
import { WorkerPool } from "./WorkerPool";

export type XadyConfig = {
  bot: {
    username: string;
    host: string;
    port: number;
    version: string;
    reconnectDelay: number;
    maxReconnectAttempts: number;
    proxy: {
      enabled: boolean;
      type: "socks5" | "socks4" | "http" | "https";
      host: string;
      port: number;
      username?: string;
      password?: string;
    };
  };
  cli: {
    prompt: string;
  };
  performance: {
    enabled: boolean;
    maxWorkers: number;
    cpuAffinity: string;
  };
};

export type SettingsItem =
  | { kind: "string"; keyPath: string; label: string }
  | { kind: "number"; keyPath: string; label: string }
  | { kind: "boolean"; keyPath: string; label: string }
  | { kind: "select"; keyPath: string; label: string; options: string[] };

export type SettingsCategory = {
  id: string;
  title: string;
  items: SettingsItem[];
};

export type SettingsApi = {
  getConfig: () => Readonly<XadyConfig>;
  set: (keyPath: string, value: unknown) => void;
  registerCategory: (category: SettingsCategory) => void;
  unregisterCategory: (id: string) => void;
};

const defaultConfig: XadyConfig = {
  bot: {
    username: "Xeiron",
    host: "localhost",
    port: 25565,
    version: "1.21.4",
    reconnectDelay: 5000,
    maxReconnectAttempts: 10,
    proxy: {
      enabled: false,
      type: "socks5",
      host: "127.0.0.1",
      port: 1080,
      username: "",
      password: ""
    }
  },
  cli: {
    prompt: "Xady => "
  },
  performance: {
    enabled: true,
    maxWorkers: 4,
    cpuAffinity: "all"
  }
};

function deepMerge<T>(base: T, override: Partial<T>): T {
  if (!override || typeof override !== "object") return base;
  const out: Record<string, unknown> | unknown[] = Array.isArray(base) ? [...(base as unknown[])] : { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    if (v && typeof v === "object" && !Array.isArray(v) && (base as Record<string, unknown>)[k] && typeof (base as Record<string, unknown>)[k] === "object") {
      (out as Record<string, unknown>)[k] = deepMerge((base as Record<string, unknown>)[k], v);
    } else if (v !== undefined) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out as T;
}

function getByPath(obj: unknown, keyPath: string): unknown {
  const parts = keyPath.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function setByPath(obj: unknown, keyPath: string, value: unknown) {
  const parts = keyPath.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i] as string;
    if (!(cur as Record<string, unknown>)[p] || typeof (cur as Record<string, unknown>)[p] !== "object") (cur as Record<string, unknown>)[p] = {};
    cur = (cur as Record<string, unknown>)[p];
  }
  (cur as Record<string, unknown>)[parts[parts.length - 1] as string] = value;
}

export class SettingsManager {
  readonly #configPath: string;
  #config: XadyConfig;
  #categories: Map<string, SettingsCategory>;
  public onPromptChange?: (newPrompt: string) => void;

  constructor(configPath: string) {
    this.#configPath = configPath;
    this.#config = this.load();
    this.#categories = new Map();
  }

  load(): XadyConfig {
    try {
      if (!existsSync(this.#configPath)) {
        const config = { ...defaultConfig };
        writeFileSync(this.#configPath, JSON.stringify(config, null, 2), "utf8");
        console.log(`[Config] Yeni config dosyası oluşturuldu: ${this.#configPath}`);
        return config;
      }
      const raw = readFileSync(this.#configPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<XadyConfig>;
      return deepMerge({ ...defaultConfig }, parsed ?? {});
    } catch (e) {
      console.error(`[Config] Dosya okuma hatası:`, e);
      return { ...defaultConfig };
    }
  }

  save() {
    writeFileSync(this.#configPath, JSON.stringify(this.#config, null, 2), "utf8");
  }

  getConfig(): Readonly<XadyConfig> {
    return this.#config;
  }

  set(keyPath: string, value: unknown) {
    setByPath(this.#config as any, keyPath, value);
    this.save();
  }

  registerCategory(category: SettingsCategory) {
    this.#categories.set(category.id, category);
  }

  unregisterCategory(id: string) {
    this.#categories.delete(id);
  }

  getRegisteredCategories(): SettingsCategory[] {
    return Array.from(this.#categories.values()).sort((a, b) => a.title.localeCompare(b.title));
  }

  getApi(): SettingsApi {
    return {
      getConfig: () => this.getConfig(),
      set: (keyPath, value) => {
        this.set(keyPath, value);
        
        if (keyPath.startsWith("performance.")) {
          const p = this.getConfig().performance;
          WorkerPool.getInstance().init(p.enabled, p.maxWorkers, p.cpuAffinity);
        }

        if (keyPath === "cli.prompt" && this.onPromptChange) {
            this.onPromptChange(String(value));
        }
      },
      registerCategory: (category) => this.registerCategory(category),
      unregisterCategory: (id) => this.unregisterCategory(id)
    };
  }

  public reloadConfig() {
    this.#config = this.load();
  }
}

export function createSettingsProxy(api: SettingsApi): SettingsApi {
  return new Proxy(api, {
    set(target, prop, value) {
      const activeModule = activeModuleStorage.getStore();
      if (activeModule) {
        console.warn(chalk.red(`[Güvenlik] "${activeModule}" modülü Xady.settings API'sini değiştirmeye çalıştı ve engellendi.`));
        return false;
      }
      return Reflect.set(target, prop, value);
    },
    defineProperty(target, prop, descriptor) {
      return false;
    },
    deleteProperty(target, prop) {
      return false;
    }
  });
}
