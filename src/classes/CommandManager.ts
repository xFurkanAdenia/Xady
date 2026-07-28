import { PluginCommand } from "../command/PluginCommand";
import Client from "./Client";
import CommandSender from "../models/CommandSender";
import chalk from "chalk";
import { command as cmdPrefix, error, xady } from "../utils/prefix";

import { activeModuleStorage } from "../context";
import { XadyScheduler } from "./XadyScheduler";

export default class CommandManager {
    // We store plugin commands in an array since multiple modules can register the same command name.
    readonly #commands = new Map<string, PluginCommand[]>();
    readonly #client: Client;

    constructor(client: Client) {
        this.#client = client;
    }

    public loadCommands(dir: string): unknown[] {
        return require("../functions/bot/loadCommands").default(this.#client, dir);
    }

    public registerCommand(command: PluginCommand): void {
        const name = command.getName().toLowerCase();
        
        // Safety guard: fake registry prevention
        const module = command.getModule();
        if (module) {
            const activeModule = activeModuleStorage.getStore();
            if (activeModule && activeModule !== module.getName()) {
                throw new Error(`Güvenlik Engeli: "${activeModule}" modülü, "${module.getName()}" modülü adına komut kaydetmeye çalıştı!`);
            }
        }

        if (!this.#commands.has(name)) {
            this.#commands.set(name, []);
        }
        this.#commands.get(name)!.push(command);

        for (const alias of command.getAliases()) {
            const aliasLower = alias.toLowerCase();
            if (!this.#commands.has(aliasLower)) {
                this.#commands.set(aliasLower, []);
            }
            this.#commands.get(aliasLower)!.push(command);
        }
    }

    public getCommand(name: string): PluginCommand | undefined {
        // Handle namespaced format like '!modulAdı:komut' or '!xady:komut'
        if (name.includes(":")) {
            const parts = name.split(":");
            const namespace = parts[0]!.toLowerCase();
            const cmdName = parts.slice(1).join(":").toLowerCase();

            const cmdList = this.#commands.get(cmdName);
            if (cmdList) {
                return cmdList.find(c => {
                    const mod = c.getModule();
                    const modName = mod ? mod.getName().toLowerCase() : "xady";
                    return modName === namespace;
                });
            }
            return undefined;
        }

        const list = this.#commands.get(name.toLowerCase());
        if (list && list.length > 0) {
            // Check for conflict warning
            if (list.length > 1) {
                const modules = list.map(c => c.getModule()?.getName() || "xady").join(", ");
                console.log(xady + cmdPrefix + chalk.yellow(`[Çakışma] "${name}" komutu birden fazla modülde tanımlı: ${modules}. Belirli birini çalıştırmak için "!modülAdı:${name}" (veya yerleşik komutlar için "!xady:${name}") kullanabilirsiniz. İlk kayıt çalıştırılıyor.`));
            }
            return list[0]; // Returns first registered command (default priority)
        }
        return undefined;
    }

    public getCommands(): ReadonlyMap<string, readonly PluginCommand[]> {
        return this.#commands;
    }

    public unregisterAll(module: import("../models/BaseModule").default): void {
        for (const [key, cmdList] of this.#commands.entries()) {
            const filtered = cmdList.filter(c => c.getModule() !== module);
            if (filtered.length === 0) {
                this.#commands.delete(key);
            } else {
                this.#commands.set(key, filtered);
            }
        }
    }


    public async executeCommand(sender: CommandSender, rawCommand: string): Promise<void> {
        if (!rawCommand) return;
        const args = rawCommand.split(/\s+/);
        const label = args.shift()?.toLowerCase();
        if (!label) return;

        const cmd = this.getCommand(label);
        if (cmd) {
            const moduleName = cmd.getModule() ? cmd.getModule()!.getName() : "Built-in";
            
            // Watchdog & Metrics start
            const start = process.hrtime.bigint();
            try {
                if (cmd.getModule()) {
                    await activeModuleStorage.run(moduleName, async () => {
                        await cmd.execute(sender, label, args);
                    });
                } else {
                    await cmd.execute(sender, label, args);
                }
            } catch (e) {
                console.error(xady + cmdPrefix + error, chalk.redBright(`Komut çalıştırılırken hata: ${label}`), e);
            } finally {
                const diff = process.hrtime.bigint() - start;
                const durationMs = Number(diff) / 1_000_000;

                // Watchdog warnings
                if (durationMs > 250 && cmd.getModule()) {
                    console.warn(`[Watchdog] WARNING: "${moduleName}" modülü "${label}" komutunu işlerken ${durationMs.toFixed(2)}ms gecikmeye sebep oldu.`);
                    if (durationMs > 1000) {
                        console.error(`[Watchdog] CRITICAL: "${moduleName}" modülü komut limiti olan 1000ms'yi aştı! Güvenlik nedeniyle otomatik devre dışı bırakılıyor.`);
                        try {
                            cmd.getModule()!.setEnabled(false);
                        } catch (disableErr) {
                            console.error(`Kapatma hatası:`, disableErr);
                        }
                    }
                }
            }
        } else {
            sender.sendMessage("Bilinmeyen komut.");
        }
    }
}