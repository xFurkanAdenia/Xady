import CommandSender from "../../../models/CommandSender";
import { Bot } from "../../../types";

export default class PluginsCommand extends Xady.Command {
    private static cache:
        | {
              at: number;
              plugins: string[];
              guessedPlugins: string[];
          }
        | undefined;

    constructor() {
        super("plugins");
    }

    async execute(bot: Bot, sender: CommandSender, args: string[]): Promise<void> {
        const forceRefresh = args.some(a => a.toLowerCase() === "refresh" || a.toLowerCase() === "yenile");
        const now = Date.now();
        const ttlMs = 2 * 60 * 1000;

        if (!forceRefresh && PluginsCommand.cache && now - PluginsCommand.cache.at < ttlMs) {
            this.sendPluginList(sender, PluginsCommand.cache.plugins, PluginsCommand.cache.guessedPlugins, true);
            return;
        }

        sender.sendMessage("§aPlugin listesi taranıyor, lütfen bekleyin...");

        try {
            const completions = await bot.tabComplete("/");
            
            const plugins = new Set<string>();
            const commands = new Set<string>();

            for (const completion of completions) {
                const text = this.extractCompletionText(completion);
                if (!text || typeof text !== "string") continue;

                const normalized = this.normalizeCompletion(text);
                if (!normalized) continue;

                const match = normalized.match(/^([a-zA-Z0-9_.-]+):/);
                if (match) {
                    const ns = match[1].toLowerCase();
                    const ignoredNamespaces = new Set(["minecraft", "bukkit", "spigot", "paper", "brigadier"]);
                    if (!ignoredNamespaces.has(ns)) {
                        plugins.add(match[1]);
                    }
                }
                this.addCommandVariants(commands, normalized);
            }

            const pluginList = Array.from(plugins).sort((a, b) => a.localeCompare(b));
            const guessedPlugins = this.guessPluginsFromCommands(commands);

            PluginsCommand.cache = {
                at: now,
                plugins: pluginList,
                guessedPlugins
            };

            this.sendPluginList(sender, pluginList, guessedPlugins, false);

        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            sender.sendMessage(`§cHata oluştu: ${msg}`);
        }
    }

    private extractCompletionText(completion: unknown): string | null {
        if (typeof completion === "string") return completion;
        if (!completion || typeof completion !== "object") return null;

        const c = completion as Record<string, unknown>;
        const candidates = [c.match, c.name, c.text, c.value];
        for (const v of candidates) {
            if (typeof v === "string" && v.trim().length > 0) return v;
        }
        return null;
    }

    private normalizeCompletion(text: string): string | null {
        const trimmed = text.trim();
        if (!trimmed) return null;

        const token = trimmed.split(/\s+/)[0];
        if (!token) return null;

        if (token.startsWith("/") && !token.startsWith("//")) return token.slice(1);
        return token;
    }

    private addCommandVariants(target: Set<string>, command: string) {
        const base = command.trim();
        if (!base) return;

        target.add(base);

        if (base.startsWith("/")) {
            target.add(base.replace(/^\/+/, ""));
        }

        const colonIndex = base.indexOf(":");
        if (colonIndex !== -1 && colonIndex < base.length - 1) {
            target.add(base.slice(colonIndex + 1));
        }
    }

    private guessPluginsFromCommands(commands: Set<string>): string[] {
        const commonPlugins: Record<string, string[]> = {
            Essentials: ["tp", "spawn", "warp", "msg", "eco", "home", "sethome", "tpa"],
            WorldEdit: ["//wand", "//pos1", "//pos2", "wand", "pos1", "pos2"],
            LuckPerms: ["lp", "luckperms"],
            Vault: ["vault"],
            AuthMe: ["authme", "register", "login"],
            PlaceholderAPI: ["papi", "placeholderapi"],
            Skript: ["sk", "skript"],
            Citizens: ["npc", "citizens"],
            HolographicDisplays: ["hd", "holo", "holograms"],
            ViaVersion: ["viaversion", "viaver", "viabackwards", "viarewind"]
        };

        const detected: string[] = [];
        for (const [plugin, signatures] of Object.entries(commonPlugins)) {
            if (signatures.some(s => commands.has(s))) {
                detected.push(plugin);
            }
        }
        return detected.sort((a, b) => a.localeCompare(b));
    }

    private sendPluginList(sender: CommandSender, plugins: string[], guessedPlugins: string[], fromCache: boolean) {
        const tag = fromCache ? " §7(cache)" : "";

        if (plugins.length > 0) {
            this.sendChunked(sender, `§6Bulunan Pluginler (${plugins.length})${tag}: §f`, plugins);
            return;
        }

        if (guessedPlugins.length > 0) {
            this.sendChunked(sender, `§6Tahmin Edilen Pluginler (${guessedPlugins.length})${tag}: §f`, guessedPlugins);
            return;
        }

        sender.sendMessage(`§cHiçbir plugin tespit edilemedi.${tag}`);
    }

    private sendChunked(sender: CommandSender, prefix: string, items: string[]) {
        const maxLen = 220;
        let current = prefix;

        for (const item of items) {
            const next = current.endsWith("§f") || current.endsWith(": §f") ? `${current}${item}` : `${current}, ${item}`;
            if (next.length > maxLen) {
                sender.sendMessage(current);
                current = `${prefix}${item}`;
            } else {
                current = next;
            }
        }

        if (current !== prefix) {
            sender.sendMessage(current);
        }
    }
}
