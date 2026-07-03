import { readdirSync, statSync, existsSync } from "fs";
import path from "path";
import Event from "../../models/Event";
import { Bot } from "../../types";
import { BotEvents, chatPatternOptions } from "mineflayer";
import chalk from "chalk";
import { event, success, xady } from "../../utils/prefix";
import Client from "../../classes/Client";
import AdmZip from "adm-zip";

function getXextPath(dir: string): string | null {
    const match = dir.match(/^(.+?\.(?:xext|xar))/);
    return match ? match[1] : null;
}

export default function loadEvents(bot: Bot, client: Client, dir: string) {
    function readEvents(readDir: string) {
        const loadedEvents: Event<keyof BotEvents>[] = [];
        const unregisteredChatPatterns: [name: string, pattern: RegExp, options: chatPatternOptions][] = [];

        const xextPath = getXextPath(readDir);

        // ZIP-aware mod
        if (xextPath && existsSync(xextPath)) {
            const zip = new AdmZip(xextPath);

            const internalPrefix = readDir
                .substring(xextPath.length + 1)
                .replace(/\\/g, '/') + '/';

            const entries = zip.getEntries().filter(e => {
                const n = e.entryName;
                return n.startsWith(internalPrefix) &&
                    !n.replace(internalPrefix, '').includes('/') &&
                    n.endsWith('.js');
            });

            for (const entry of entries) {
                const filePath = path.join(xextPath, entry.entryName);
                try {
                    delete require.cache[filePath];
                    const eventClass: new () => Event<keyof BotEvents> = (require(filePath).default || require(filePath));
                    if (!eventClass || !Event.prototype.isPrototypeOf(eventClass.prototype)) continue;
                    const eventInstance = new eventClass();
                    bot[eventInstance.isOnce() ? "once" : "on"](eventInstance.getName() as keyof BotEvents, eventInstance.execute.bind(eventInstance));
                    if (eventInstance.getPattern()) unregisteredChatPatterns.push([eventInstance.getRawName(), eventInstance.getPattern() as RegExp, eventInstance.getPatternOptions() ?? { parse: true, repeat: true }]);
                    console.log(xady + success + event, chalk.yellow(eventInstance.getName()) + chalk.green(" adlı event başarıyla yüklendi."));
                    loadedEvents.push(eventInstance);
                } catch (e) {
                    console.error(chalk.red(`[loadEvents] ${entry.entryName} yüklenemedi:`), e);
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
                readEvents(path.join(xextPath, subDir.entryName));
            }

            bot.once("login", () => {
                unregisteredChatPatterns.forEach((v) => {
                    bot.addChatPattern(v[0], v[1], v[2]);
                });
            });

            return loadedEvents;
        }

        // Normal dosya sistemi modu
        if (!existsSync(readDir)) return loadedEvents;
        const files = readdirSync(readDir);
        for (const file of files) {
            const filePath = path.join(readDir, file);
            const fileStat = statSync(filePath);
            if (fileStat.isDirectory()) {
                readEvents(filePath);
                continue;
            }
            delete require.cache[require.resolve(filePath)];
            const eventClass: new () => Event<keyof BotEvents> = (require(filePath).default || require(filePath));
            if (!eventClass || !Event.prototype.isPrototypeOf(eventClass.prototype)) continue;
            const eventInstance = new eventClass();
            bot[eventInstance.isOnce() ? "once" : "on"](eventInstance.getName() as keyof BotEvents, eventInstance.execute.bind(eventInstance));
            if (eventInstance.getPattern()) unregisteredChatPatterns.push([eventInstance.getRawName(), eventInstance.getPattern() as RegExp, eventInstance.getPatternOptions() ?? { parse: true, repeat: true }]);
            console.log(xady + success + event, chalk.yellow(eventInstance.getName()) + chalk.green(" adlı event başarıyla yüklendi."));
            loadedEvents.push(eventInstance);
        }

        bot.once("login", () => {
            unregisteredChatPatterns.forEach((v) => {
                bot.addChatPattern(v[0], v[1], v[2]);
            });
        });

        return loadedEvents;
    }
    return readEvents(dir);
}