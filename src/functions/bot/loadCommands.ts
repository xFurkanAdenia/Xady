import { readdirSync, statSync, existsSync } from "fs";
import path from "path";

import Client from "../../classes/Client";
import Command from "../../models/Command";
import chalk from "chalk";
import { command, success, xady } from "../../utils/prefix";
import AdmZip from "adm-zip";

function getXextPath(dir: string): string | null {
    const match = dir.match(/^(.+?\.(?:xext|xar))/);
    return match ? match[1] : null;
}

export default function loadCommands(client: Client, dir: string) {
    function readCommands(readDir: string) {
        const loadedCommands: Command[] = [];
        const commandManager = client.getCommandManager();

        const xextPath = getXextPath(readDir);

        // ZIP-aware mod
        if (xextPath && existsSync(xextPath)) {
            const zip = new AdmZip(xextPath);
            const xextRoot = xextPath;

            // readDir'in ZIP içindeki prefix'ini hesapla
            // Örn: readDir = "C:\...\Utilities.xext\src\commands"
            // → internalPrefix = "src/commands/"
            const internalPrefix = readDir
                .substring(xextPath.length + 1)
                .replace(/\\/g, '/') + '/';

            const entries = zip.getEntries().filter(e => {
                const n = e.entryName;
                return n.startsWith(internalPrefix) &&
                    !n.replace(internalPrefix, '').includes('/') && // Sadece direkt alt dosyalar
                    n.endsWith('.js');
            });

            for (const entry of entries) {
                const filePath = path.join(xextPath, entry.entryName);
                try {
                    delete require.cache[filePath];
                    const CommandClass: new () => Command = (require(filePath).default || require(filePath));
                    if (!CommandClass || !Command.prototype.isPrototypeOf(CommandClass.prototype)) continue;
                    const CommandInstance = new CommandClass();
                    const cmd = new Xady.PluginCommand(CommandInstance.getName(), null);
                    cmd.setExecutor({
                        onCommand: async (sender, pluginCmd, label, args) => {
                            const bot = client.getBot();
                            if (bot) await CommandInstance.execute(bot, sender, args);
                            return true;
                        }
                    });
                    commandManager.registerCommand(cmd);
                    console.log(xady + success + command, chalk.yellow(CommandInstance.getName()) + chalk.green(" adlı komut başarıyla yüklendi."));
                    loadedCommands.push(CommandInstance);
                } catch (e) {
                    console.error(chalk.red(`[loadCommands] ${entry.entryName} yüklenemedi:`), e);
                }
            }

            // Alt klasörleri de tara (recursive)
            const subDirs = zip.getEntries().filter(e => {
                const n = e.entryName;
                return n.startsWith(internalPrefix) &&
                    e.isDirectory &&
                    n !== internalPrefix;
            });
            for (const subDir of subDirs) {
                readCommands(path.join(xextPath, subDir.entryName));
            }

            return loadedCommands;
        }

        // Normal dosya sistemi modu (xext dışı)
        if (!existsSync(readDir)) return loadedCommands;
        const files = readdirSync(readDir);
        for (const file of files) {
            const filePath = path.join(readDir, file);
            const fileStat = statSync(filePath);
            if (fileStat.isDirectory()) {
                readCommands(filePath);
                continue;
            }
            delete require.cache[require.resolve(filePath)];
            const CommandClass: new () => Command = (require(filePath).default || require(filePath));
            if (!CommandClass || !Command.prototype.isPrototypeOf(CommandClass.prototype)) continue;
            const CommandInstance = new CommandClass();
            const cmd = new Xady.PluginCommand(CommandInstance.getName(), null);
            cmd.setExecutor({
                onCommand: async (sender, pluginCmd, label, args) => {
                    const bot = client.getBot();
                    if (bot) await CommandInstance.execute(bot, sender, args);
                    return true;
                }
            });
            commandManager.registerCommand(cmd);
            console.log(xady + success + command, chalk.yellow(CommandInstance.getName()) + chalk.green(" adlı komut başarıyla yüklendi."));
            loadedCommands.push(CommandInstance);
        }
        return loadedCommands;
    }
    return readCommands(dir);
}