import chalk from "chalk";
import Client from "../classes/Client";
import { PluginCommand } from "../command/PluginCommand";
import { CommandExecutor } from "../command/CommandExecutor";
import { TabCompleter } from "../command/TabCompleter";
import CommandSender from "../models/CommandSender";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "path";

import { XadyScheduler } from "../classes/XadyScheduler";

export type SettingsApiLike = {
    getConfig: () => any;
    set: (keyPath: string, value: unknown) => void;
};

function startsWithIgnoreCase(value: string, prefix: string): boolean {
    return value.toLowerCase().startsWith(prefix.toLowerCase());
}

export default function registerModulesCommands(client: Client, settings: SettingsApiLike) {
    class ModulesCommandExecutor implements CommandExecutor, TabCompleter {
        async onCommand(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<boolean> {
            const modules = client.getModuleManager().getModules();
            const action = (args[0] ?? "list").toLowerCase();

            const findKey = (name: string) => {
                const wanted = name.toLowerCase();
                for (const key of modules.keys()) {
                    if (key.toLowerCase() === wanted) return key;
                }
                return undefined;
            };

            if (!action || action === "list") {
                const modulesList = Array.from(modules.keys()).map((name: string) => modules.get(name)?.getEnabled() ? chalk.greenBright(name) : chalk.redBright(name)).join(", ");
                sender.sendMessage(`Loaded modules (${modules.size}): ${modulesList}`);
                return true;
            }

            if (action === "load") {
                const target = args[1];
                if (!target) {
                    sender.sendMessage("Kullanım: !modules load <DosyaAdı.xext>");
                    return true;
                }
                
                try {
                    const moduleManager = client.getModuleManager();
                    
                    // Modülün zaten yüklü olup olmadığını kontrol et
                    const moduleName = target.replace(/\.(xext|xar)$/, "");
                    const isAlreadyLoaded = Array.from(modules.keys()).some(
                        k => k.toLowerCase() === moduleName.toLowerCase()
                    );
                    
                    if (isAlreadyLoaded) {
                        sender.sendMessage(chalk.red(`Bu modül (${moduleName}) zaten yüklü! Yeniden yüklemek için '!modules reload ${moduleName}' komutunu kullanın.`));
                        return true;
                    }

                    // Yalnızca modules klasöründen yüklenmesine izin ver
                    const modulesDir = moduleManager["dir"] ?? "dist/modules";
                    const safeTarget = path.basename(target);
                    
                    moduleManager.loadModules(modulesDir, safeTarget);
                    sender.sendMessage(`§a${safeTarget} arşivi başarıyla yüklendi.`);
                } catch(e: any) {
                    sender.sendMessage(`§cModül yüklenirken hata oluştu: ${e.message}`);
                }
                return true;
            }

            if (action === "health" || action === "status") {
                const target = args[1];
                if (!target) {
                    sender.sendMessage(`Kullanım: !modules ${action} <ModülAdı>`);
                    return true;
                }
                const key = findKey(target);
                if (!key) {
                    sender.sendMessage(`§c'${target}' adında bir modül bulunamadı.`);
                    return true;
                }
                const mod = modules.get(key);
                if (!mod) return true;

                const metrics = (client.getEventManager() as any).eventMetrics?.get(key) || { count: 0, totalDurationMs: 0 };
                
                if (action === "health") {
                    const activeSchedulers = XadyScheduler.getInstance().getActiveTaskCount(key);
                    sender.sendMessage(`--- ${chalk.cyanBright(key)} Sağlık Raporu ---`);
                    sender.sendMessage(`CPU Süresi (Toplam Event): ${metrics.totalDurationMs.toFixed(2)} ms`);
                    sender.sendMessage(`Aktif Zamanlanmış Görev (Scheduler): ${activeSchedulers}`);
                    sender.sendMessage(`Aktif Chat Pattern Sayısı: ${(mod as any).chatPatterns?.size || 0}`);
                    sender.sendMessage(`Durum: ${mod.getEnabled() ? chalk.green("Aktif") : chalk.red("Pasif")}`);
                } else {
                    const avgEvent = metrics.count > 0 ? (metrics.totalDurationMs / metrics.count).toFixed(2) : "0.00";
                    sender.sendMessage(`--- ${chalk.cyanBright(key)} Durum Raporu ---`);
                    sender.sendMessage(`Yüklenme Yolu: ${mod.getModuleManifest().getMain()}`);
                    sender.sendMessage(`Versiyon: ${mod.getModuleManifest().getVersion()}`);
                    sender.sendMessage(`Toplam İşlenen Event: ${metrics.count}`);
                    sender.sendMessage(`Ortalama Event İşleme Süresi: ${avgEvent} ms`);
                }
                return true;
            }

            if (action === "enable" || action === "disable" || action === "toggle" || action === "reload") {
                const target = args[1];
                if (!target) {
                    sender.sendMessage("Kullanım: !modules <list/enable/disable/toggle/reload/load> <ModülAdı|all>");
                    return true;
                }

                if (action === "reload" && target.toLowerCase() === "all") {
                    const names = Array.from(modules.keys()).sort((a, b) => a.localeCompare(b));
                    for (const name of names) modules.get(name)?.setEnabled(false);
                    for (const name of names) modules.get(name)?.setEnabled(true);
                    sender.sendMessage(`§aTüm modüller yeniden yüklendi. (${names.length})`);
                    return true;
                }

                const key = findKey(target);
                if (!key) {
                    sender.sendMessage(`§c'${target}' adında bir modül bulunamadı.`);
                    return true;
                }

                const mod = modules.get(key);
                if (!mod) return true;

                if (action === "enable") mod.setEnabled(true);
                else if (action === "disable") mod.setEnabled(false);
                else if (action === "toggle") mod.setEnabled(!mod.getEnabled());
                else if (action === "reload") {
                    mod.setEnabled(false);
                    mod.setEnabled(true);
                }

                const cfg = settings.getConfig();
                const disabled: string[] = Array.isArray(cfg?.modules?.disabled) ? [...cfg.modules.disabled] : [];
                const set = new Set(disabled);
                if (mod.getEnabled()) set.delete(key);
                else set.add(key);
                settings.set("modules.disabled", Array.from(set).sort((a, b) => a.localeCompare(b)));

                sender.sendMessage(`${chalk.greenBright(key)} modülü: ${mod.getEnabled() ? "aktif" : "kapalı"}`);
                return true;
            }

            sender.sendMessage("Kullanım: !modules <list/enable/disable/toggle/reload/load/health/status> <ModülAdı|all>");
            return true;
        }
        async onTabComplete(sender: CommandSender, command: PluginCommand, label: string, args: string[]): Promise<string[]> {
            const action = (args[0] ?? "").toLowerCase();

            if (args.length <= 1) {
                const actions = ["list", "enable", "disable", "toggle", "reload", "load", "health", "status"];
                return actions.filter(a => startsWithIgnoreCase(a, action));
            }

            if (args.length === 2) {
                const modulePrefix = args[1] ?? "";
                if (action === "load") {
                    try {
                        const moduleManager = client.getModuleManager();
                        const targetDir = moduleManager["dir"] ?? "dist/modules";
                        let filePrefix = path.basename(modulePrefix);

                        if (existsSync(targetDir)) {
                            const items = readdirSync(targetDir);
                            const candidates: string[] = [];
                            
                            const loadedModules = Array.from(client.getModuleManager().getModules().keys()).map(k => k.toLowerCase());
                            
                            for (const item of items) {
                                if (filePrefix && !item.toLowerCase().startsWith(filePrefix.toLowerCase())) continue;

                                const itemPath = path.join(targetDir, item);
                                const stat = statSync(itemPath);

                                if (stat.isFile() && (item.endsWith(".xext") || item.endsWith(".xar"))) {
                                    const modName = item.replace(/\.(xext|xar)$/, "").toLowerCase();
                                    // Yüklü olanları önerme
                                    if (!loadedModules.includes(modName)) {
                                        candidates.push(item);
                                    }
                                }
                            }
                            return candidates;
                        }
                    } catch(e) {}
                    return [];
                } else if (["enable", "disable", "toggle", "reload", "health", "status"].includes(action)) {
                    const modules = client.getModuleManager().getModules();
                    const moduleNames = Array.from(modules.keys()).sort((a, b) => a.localeCompare(b));
                    const candidates = action === "reload" ? ["all", ...moduleNames] : moduleNames;
                    return candidates.filter(m => startsWithIgnoreCase(m, modulePrefix));
                }
            }
            return [];
        }
    }

    const exec = new ModulesCommandExecutor();
    const modulesCmd = new PluginCommand("modules")
        .setAliases(["module"])
        .setExecutor(exec)
        .setTabCompleter(exec);
    
    client.getCommandManager().registerCommand(modulesCmd);
}
