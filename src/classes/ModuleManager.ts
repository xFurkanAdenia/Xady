import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";

import os from "os";
import { checkModuleJsonManifest } from "../utils/check";
import BaseModule from "../models/BaseModule";
import chalk from "chalk";
import Client from "./Client";
import ModuleManifest from "../models/ModuleManifest";
import AdmZip from "adm-zip";
import AppDataManager from "../utils/appdata";
import { activeModuleStorage } from "../context";
import fs from "fs";

class ModuleError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ModuleError";
    }
}

interface LoadedManifest {
    name: string;
    dir: string;
    dataFolder: string;
    xextPath: string;
    manifest: ModuleManifest;
}

export default class ModuleManager {
    #modules: Map<string, BaseModule>;
    #client: Client;
    public dir!: string;

    constructor(client: Client) {
        this.#client = client;
        this.#modules = new Map();
        (global as any).__XADY_MODULES__ = this.#modules;
    }

    loadModules(dir: string, targetFile?: string) {
        this.dir = dir;
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        const cacheBase = path.join(os.tmpdir(), "xady_xext_cache");
        if (!existsSync(cacheBase)) mkdirSync(cacheBase, { recursive: true });

        const Module = require('module');
        if (!Module.__xadyHooked) {
            Module.__xadyHooked = true;
            const originalResolveFilename = Module._resolveFilename;
            const originalLoad = Module._extensions['.js'];

            const xadyDistPath       = path.resolve(__dirname, "..");
            const xadyNodeModulesPath = path.resolve(__dirname, "../../node_modules");

            // ── Yardımcı: ZIP içinde entry ara ──────────────────────────────────────
            const findZipEntry = (zip: AdmZip, internalPath: string) => {
                const p = internalPath.replace(/\\/g, '/').replace(/\/$/, '');
                return (
                    zip.getEntry(p)              ||
                    zip.getEntry(p + '.js')      ||
                    zip.getEntry(p + '/index.js')
                );
            };

            // ── VFS: ZIP içinden JS dosyası oku ─────────────────────────────────────
            Module._extensions['.js'] = function (module: NodeJS.Module & { _compile: (content: string, filename: string) => void }, filename: string) {

                // __xady_typings__ → global Xady nesnesini döndür
                if (filename.includes('__xady_typings__')) {
                    return module._compile(
                        `module.exports = { default: global.Xady, ...global.Xady };`,
                        filename
                    );
                }

                if (filename.includes('__xady_empty__')) {
                    return module._compile('module.exports = {};', filename);
                }

                // __xady_self__ → Get the current active module's safe metadata/instance
                if (filename.includes('__xady_self__')) {
                    return module._compile(
                        `
                        const { activeModuleStorage } = require(${JSON.stringify(path.join(__dirname, '..', 'context').replace(/\\/g, '/'))});
                        module.exports = {
                            getSelf: () => {
                                const activeName = activeModuleStorage.getStore();
                                if (!activeName) return null;
                                return global.__XADY_MODULES__?.get(activeName) || null;
                            }
                        };
                        `,
                        filename
                    );
                }

                // __xady_module_ModulAdi__ → runtime exports döndür
                const match = filename.match(/__xady_module_(.+)__/);
                if (match) {
                    return module._compile(
                        `module.exports = global.__XADY_MODULES__.get("${match[1]}");`,
                        filename
                    );
                }

                if (filename.includes('.xext') || filename.includes('.xar')) {
                    try {
                        const extMatch = filename.match(/(.+?\.(?:xext|xar))[\\/](.+)$/);
                        if (extMatch) {
                            const zipPath      = extMatch[1];
                            const internalPath = extMatch[2].replace(/\\/g, '/');
                            const zip          = new AdmZip(zipPath);
                            const entry        = findZipEntry(zip, internalPath);

                            if (entry) {
                                const content = entry.getData().toString('utf8');
                                return module._compile(content, filename);
                            }

                            console.error(chalk.red(`[VFS] ZIP içinde bulunamadı: ${internalPath} (${zipPath})`));
                        }
                    } catch (e) {
                        console.error(chalk.red(`[VFS] Dosya ZIP içinden okunamadı: ${filename}`), e);
                    }
                }

                return originalLoad(module, filename);
            };

            // ── Resolve ──────────────────────────────────────────────────────────────
            Module._resolveFilename = function (request: string, parent: NodeJS.Module, isMain: boolean, options: unknown) {

                // Zaten xext/xar path'i → doğrudan döndür
                if (
                    request.includes('.xext\\') || request.includes('.xext/') ||
                    request.includes('.xar\\')  || request.includes('.xar/')  ||
                    request.endsWith('.xext')   || request.endsWith('.xar')
                ) {
                    return request;
                }

                // Intercept self import
                if (request === '__xady_self__') {
                    return '__xady_self__';
                }

                // Cross-Module Runtime Interception:
                // 1. Yüklü modüller (runtime instance'lar)
                if ((global as any).__XADY_MODULES__?.has(request)) {
                    return `__xady_module_${request}__`;
                }

                // 2. %APPDATA%/.xady/cache/<ModuleName>/ → paylaşılan kütüphane kodu (compile-time includes/)
                if (!request.startsWith('.') && !path.isAbsolute(request)) {
                    const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
                    const globalCachePath = path.join(appData, '.xady', 'cache', request);
                    if (fs.existsSync(globalCachePath)) {
                        // package.json varsa main'e bak, yoksa index.js dene
                        const pkgPath = path.join(globalCachePath, 'package.json');
                        if (fs.existsSync(pkgPath)) {
                            try {
                                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                                const mainFile = pkg.main || 'index.js';
                                return path.join(globalCachePath, mainFile);
                            } catch (_) {}
                        }
                        const indexPath = path.join(globalCachePath, 'index.js');
                        if (fs.existsSync(indexPath)) return indexPath;
                    }
                }

                const isFromZip = !!(parent?.filename && (
                    parent.filename.includes('.xext') ||
                    parent.filename.includes('.xar')
                ));

                if (!isFromZip) {
                    return originalResolveFilename.call(this, request, parent, isMain, options);
                }

                const parentXext: string =
                    parent.filename.match(/(.+?\.(?:xext|xar))/)?.[1] ?? '';

                // ── 1. Bare specifier ────────────────────────────────────────────────
                if (!request.startsWith('.') && !path.isAbsolute(request)) {
                    if (parentXext) {
                        try {
                            const zip = new AdmZip(parentXext);
                            const pkgEntry = zip.getEntry(`node_modules/${request}/package.json`);
                            if (pkgEntry) {
                                const pkg      = JSON.parse(pkgEntry.getData().toString('utf8'));
                                const mainFile = (pkg.main || 'index.js').replace(/^\.\//, '');
                                const candidates = [
                                    `node_modules/${request}/${mainFile}`,
                                    `node_modules/${request}/${mainFile}.js`,
                                    `node_modules/${request}/index.js`,
                                ];
                                for (const c of candidates) {
                                    if (zip.getEntry(c)) return path.join(parentXext, c);
                                }
                            }
                            if (zip.getEntry(`node_modules/${request}/index.js`)) {
                                return path.join(parentXext, 'node_modules', request, 'index.js');
                            }
                        } catch (_) {}
                    }

                    // ZIP'te yok → Xady node_modules
                    try {
                        return originalResolveFilename.call(this, request, parent, isMain, options);
                    } catch (_) {
                        try {
                            return originalResolveFilename.call(
                                this,
                                path.join(xadyNodeModulesPath, request),
                                parent, isMain, options
                            );
                        } catch (_) {}
                    }
                }

                // ── 2. Göreceli yollar ───────────────────────────────────────────────
                if (request.startsWith('.')) {
                    const parentDir = path.dirname(parent.filename);
                    const resolved  = path.resolve(parentDir, request);

                    // Hâlâ ZIP içinde mi?
                    const extMatch = resolved.match(/(.+?\.(?:xext|xar))[\\/](.+)$/);
                    if (extMatch) {
                        const zipPath      = extMatch[1];
                        const internalPath = extMatch[2].replace(/\\/g, '/');
                        const zip          = new AdmZip(zipPath);

                        if (zip.getEntry(internalPath))               return path.normalize(resolved);
                        if (zip.getEntry(internalPath + '.js'))        return path.normalize(resolved + '.js');
                        if (zip.getEntry(internalPath + '/index.js')) return path.normalize(resolved + '/index.js');

                        // ZIP'te yok — typings klasörü mü?
                        const baseName = path.basename(resolved).toLowerCase();
                        if (baseName === 'typings' || baseName === 'types') {
                            return path.join(zipPath, '__xady_typings__');
                        }

                        // Dist'te ara
                        const relToZip   = path.relative(parentXext, resolved);
                        const distTarget = path.resolve(xadyDistPath, relToZip);
                        if (
                            existsSync(distTarget + '.js') ||
                            existsSync(distTarget + '/index.js') ||
                            existsSync(distTarget)
                        ) {
                            try {
                                return originalResolveFilename.call(this, distTarget, parent, isMain, options);
                            } catch (_) {}
                        }

                        // Hiçbir yerde yok → boş modül
                        console.warn(chalk.yellow(`[VFS] '${request}' bulunamadı, boş modül döndürülüyor.`));
                        return path.join(zipPath, '__xady_empty__');
                    }

                    // ZIP dışına çıktı → normal Node.js resolve
                    return resolved;
                }

                // ── 3. Mutlak yol ────────────────────────────────────────────────────
            };
        }

        // Start watching libs/ folder for cross-module type extracting/tsconfig mapping
        this.watchLibsFolder();

        const manifests: Map<string, LoadedManifest> = new Map();

        // ── 1. .xext / .xar arşivlerini oku ─────────────────────────────────────────
        const readModules = (readDir: string) => {
            const items = targetFile && readDir === dir ? [targetFile] : readdirSync(readDir);
            for (const name of items) {
                const filePath = path.join(readDir, name);
                if (!existsSync(filePath)) {
                    if (targetFile) console.error(chalk.red(`[ModuleManager] Dosya bulunamadı: ${filePath}`));
                    continue;
                }
                const stat = statSync(filePath);
                if (stat.isDirectory()) continue;

                if (stat.isFile() && (name.endsWith('.xext') || name.endsWith('.xar'))) {
                    try {
                        const zip      = new AdmZip(filePath);
                        const zipEntry = zip.getEntry('module.yml') ?? zip.getEntry('module.json');
                        if (!zipEntry) throw new Error('Manifest (module.yml veya module.json) bulunamadı');

                        const raw      = zipEntry.getData().toString('utf8');
                        const manifest = checkModuleJsonManifest(raw);
                        if (!manifest) throw new Error('Geçersiz manifest');

                        const realModName = manifest.getName();
                        // MC Spigot pattern: Data klasörü modülün yüklendiği klasörde (örn. modules/Melonya)
                        const dataFolder = path.join(readDir, realModName);

                        manifests.set(realModName, {
                            name: realModName,
                            dir: filePath,
                            dataFolder,
                            xextPath: filePath,
                            manifest,
                        });
                        console.log(chalk.gray(`[XEXT] ${name} arşivi hafızaya açıldı.`));
                    } catch (e) {
                        console.error(chalk.red(`[XEXT] ${name} yüklenemedi:`), e);
                    }
                }
            }
        };
        readModules(dir);

        // ── 2. Yükleme sırası ────────────────────────────────────────────────────────
        const sorted = this.#resolveLoadOrder(manifests);

        // ── 3. Modülleri yükle ───────────────────────────────────────────────────────
        for (const modData of sorted) {
            const { name, dataFolder, xextPath, manifest } = modData;

            let mainFile     = manifest.getMain();
            if (mainFile.endsWith('.ts')) mainFile = mainFile.replace('.ts', '.js');

            const zip        = new AdmZip(xextPath);
            let internalPath = mainFile.replace(/\\/g, '/');

            if (!zip.getEntry(internalPath) && internalPath.startsWith('src/')) {
                const fallback = internalPath.replace('src/', '');
                if (zip.getEntry(fallback)) internalPath = fallback;
            }

            const mainPath = path.join(xextPath, internalPath);

            try {
                delete require.cache[mainPath];

                const loadedMod = require(mainPath);
                const ModuleClass: new (client: Client) => BaseModule =
                    loadedMod.default ?? loadedMod;

                if (!BaseModule.prototype.isPrototypeOf(ModuleClass.prototype))
                    throw new ModuleError(`${name}: BaseModule'ü extend etmiyor`);

                const moduleInstance = new ModuleClass(this.#client);
                moduleInstance['manifest']   = manifest;
                moduleInstance['client']     = this.#client;
                moduleInstance['execDir']    = this.dir;
                moduleInstance['dataFolder'] = dataFolder;
                moduleInstance['xextPath']   = xextPath;

                // ── FS Sandboxing (Karantina) ──
                // Dynamically wrap global fs calls inside this module using a proxy,
                // or proxy inject fs functions when module reads them.
                // We define a sandboxed FS proxy specifically restricting paths to module's dataFolder.
                const isPathSafe = (p: string) => {
                    const resolved = path.resolve(p);
                    const safeBase = path.resolve(dataFolder);
                    return resolved.startsWith(safeBase);
                };
                const fsSandbox = new Proxy(fs, {
                    get(target, prop) {
                        const original = Reflect.get(target, prop);
                        if (typeof original === "function") {
                            return (...args: any[]) => {
                                // Check if first argument is a path
                                if (args.length > 0 && typeof args[0] === "string") {
                                    if (!isPathSafe(args[0]) && !args[0].startsWith(os.tmpdir())) {
                                        throw new Error(`Güvenlik Engeli: "${name}" modülü dataFolder dışındaki dizinlere erişemez! (Yol: ${args[0]})`);
                                    }
                                }
                                return original(...args);
                            };
                        }
                        return original;
                    }
                });

                // Inject fsSandbox to moduleInstance's global node context (or module global properties)
                // We intercept global module loader require('fs') to serve fsSandbox to this module's thread/context.
                // For simplicity, we also inject it into instance property if they use fs helper.
                (moduleInstance as any).fs = fsSandbox;

                // ── Global Timer Hooking (Sandboxing) ──
                // Wrap native timers to track automatically when called inside this module context
                const trackedTimeouts = (moduleInstance as any).trackedTimeouts;
                const trackedIntervals = (moduleInstance as any).trackedIntervals;

                const originalSetTimeout = global.setTimeout;
                const originalSetInterval = global.setInterval;

                Object.defineProperty(moduleInstance, 'setTimeout', {
                    value: (callback: any, ms: any, ...args: any[]) => {
                        const t = originalSetTimeout(() => {
                            trackedTimeouts.delete(t);
                            callback(...args);
                        }, ms);
                        trackedTimeouts.add(t);
                        return t;
                    },
                    writable: true,
                    configurable: true,
                    enumerable: true
                });
                
                Object.defineProperty(moduleInstance, 'setInterval', {
                    value: (callback: any, ms: any, ...args: any[]) => {
                        const i = originalSetInterval(callback, ms, ...args);
                        trackedIntervals.add(i);
                        return i;
                    },
                    writable: true,
                    configurable: true,
                    enumerable: true
                });

                const existing = this.#modules.get(name);

                if (existing) {
                    // Event'leri unregister et
                    this.#client.getEventManager().unregisterAll(existing);
                    // Komutları unregister et
                    this.#client.getCommandManager().unregisterAll(existing);
                    // Servisleri unregister et
                    this.#client.getServiceManager().unregisterAll(existing);
                    try { existing.setEnabled(false); } catch (e) {
                        console.error(chalk.red(`[ModuleManager] ${name} kapatılırken hata:`), e);
                    }
                }

                this.#modules.set(name, moduleInstance);
                
                // onLoad() - Spigot API
                try {
                    if (typeof moduleInstance.onLoad === 'function') {
                        moduleInstance.onLoad();
                    }
                } catch (loadErr) {
                    console.error(chalk.red(`[ModuleManager] ${name} onLoad hatası:`), loadErr);
                }
                
                // Manifest'ten komutları oluştur ve modüle ata (Spigot benzeri)
                const cmdDefs = manifest.getCommands();
                if (cmdDefs) {
                    const cmdManager = this.#client.getCommandManager();
                    for (const [cmdName, cmdDef] of Object.entries(cmdDefs)) {
                        const cmd = new Xady.PluginCommand(cmdName, moduleInstance);
                        
                        // Spigot pattern: cmdDef null veya undefined olabilir (commands: test:)
                        if (cmdDef && typeof cmdDef === 'object') {
                            if (cmdDef.description)           cmd.setDescription(cmdDef.description);
                            if (cmdDef.usage)                 cmd.setUsage(cmdDef.usage);
                            if (cmdDef.aliases)               cmd.setAliases(cmdDef.aliases);
                            if (cmdDef.permission)            cmd.setPermission(cmdDef.permission);
                            if (cmdDef['permission-message']) cmd.setPermissionMessage(cmdDef['permission-message']);
                        }
                        
                        // Modüle komut referansı ver (this.getCommand() için)
                        moduleInstance._setCommand(cmdName, cmd);
                        
                        // CommandManager'a kaydet
                        cmdManager.registerCommand(cmd);
                        
                        console.log(chalk.gray(`  ├─ Komut kaydedildi: /${cmdName}`));
                    }
                }
                
                // setEnabled'da hata olursa modülü kaldır
                try {
                    activeModuleStorage.run(name, () => {
                        moduleInstance.setEnabled(true);
                    });
                } catch (enableErr) {
                    console.error(chalk.red(`[ModuleManager] ${name} etkinleştirilirken hata:`), enableErr);
                    // Modülü geri al
                    this.#modules.delete(name);
                    this.#client.getEventManager().unregisterAll(moduleInstance);
                    this.#client.getCommandManager().unregisterAll(moduleInstance);
                    this.#client.getServiceManager().unregisterAll(moduleInstance);
                    throw enableErr; // Hatayı dışarıya fırlat ki "başarıyla yüklendi" yazmasın
                }

                console.log(name + chalk.green(' adlı modül başarıyla yüklendi!'));
            } catch (err) {
                console.error(chalk.red(`[ModuleManager] ${name} yüklenemedi:`), err);
            }
        }
    }

    // ── Topolojik sıralama ───────────────────────────────────────────────────────────
    #resolveLoadOrder(manifests: Map<string, LoadedManifest>): LoadedManifest[] {
        const result: LoadedManifest[] = [];
        const visited = new Set<string>();

        const visit = (name: string, stack = new Set<string>()) => {
            if (visited.has(name)) return;
            const mod = manifests.get(name);
            if (!mod) return;

            if (stack.has(name)) {
                console.error(chalk.red(
                    `[ModuleManager] Döngüsel bağımlılık: ${[...stack].join(' -> ')} -> ${name}`
                ));
                return;
            }

            stack.add(name);

            for (const dep of mod.manifest.getDependencies() ?? []) {
                if (!manifests.has(dep)) {
                    console.error(chalk.red(
                        `[ModuleManager] ${name} için "${dep}" bağımlılığı bulunamadı! ${name} yüklenmeyecek.`
                    ));
                    return;
                }
                visit(dep, stack);
            }

            for (const dep of mod.manifest.getSoftDependencies() ?? []) {
                if (manifests.has(dep)) visit(dep, stack);
            }

            stack.delete(name);
            visited.add(name);
            result.push(mod);
        };

        for (const name of manifests.keys()) visit(name);
        return result;
    }

    getModules() {
        return this.#modules;
    }

    reloadModule(name: string): boolean {
        const existing = this.#modules.get(name);
        if (!existing) {
            console.error(chalk.red(`[ModuleManager] Yeniden yüklenecek modül bulunamadı: ${name}`));
            return false;
        }

        console.log(chalk.yellow(`[ModuleManager] ${name} yeniden yükleniyor...`));
        const filePath = existing['xextPath'];
        
        // 1. Unregister commands, events, and tasks
        this.#client.getEventManager().unregisterAll(existing);
        this.#client.getCommandManager().unregisterAll(existing);
        this.#client.getServiceManager().unregisterAll(existing);
        try {
            existing.setEnabled(false);
        } catch (e) {
            console.error(chalk.red(`[ModuleManager] Modül devre dışı bırakılırken hata:`), e);
        }

        this.#modules.delete(name);

        // 2. Load again
        this.loadModules(this.dir, path.basename(filePath));
        return this.#modules.has(name);
    }


    // --- includes/ Watcher & Type Autocomplete Extractor Entegrasyonu ---
    private watchLibsFolder() {
        const includesDir = path.resolve(process.cwd(), "includes");
        if (!fs.existsSync(includesDir)) {
            try {
                fs.mkdirSync(includesDir, { recursive: true });
            } catch (e) {}
        }

        const scanLibs = () => {
            if (!fs.existsSync(includesDir)) return;
            const files = fs.readdirSync(includesDir);
            for (const file of files) {
                if (file.endsWith(".d.xext") || file.endsWith(".d.xar")) {
                    const filePath = path.join(includesDir, file);
                    this.extractTypesFromXext(filePath);
                }
            }
        };

        // Scan initially
        scanLibs();

        // Simple debounce watch
        let timeout: NodeJS.Timeout | null = null;
        try {
            fs.watch(includesDir, (event, filename) => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    scanLibs();
                }, 500);
            });
        } catch (e) {
            // fs.watch not supported or errors out, fallback to interval
            setInterval(scanLibs, 5000);
        }
    }

    private extractTypesFromXext(filePath: string) {
        try {
            const zip = new AdmZip(filePath);
            // Search inside zip for .ts files in types/
            const entries = zip.getEntries();
            const tsEntries = entries.filter(e => e.entryName.startsWith("types/") && e.entryName.endsWith(".ts"));
            if (tsEntries.length === 0) return;

            // Guess module name from filename or manifest inside zip
            let modName = path.basename(filePath, path.extname(filePath));
            if (modName.endsWith(".d")) {
                modName = modName.substring(0, modName.length - 2);
            }
            const zipEntry = zip.getEntry('module.yml');
            if (zipEntry) {
                const manifest = checkModuleJsonManifest(zipEntry.getData().toString('utf8'));
                if (manifest) {
                    modName = manifest.getName();
                }
            }

            const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
            const globalXadyDir = path.join(appData, ".xady");
            const globalLibsDir = path.join(globalXadyDir, "libs");
            const globalCacheDir = path.join(globalXadyDir, "cache");

            const targetLibsDir = path.join(globalLibsDir, modName);
            if (fs.existsSync(targetLibsDir)) fs.rmSync(targetLibsDir, { recursive: true, force: true });
            fs.mkdirSync(targetLibsDir, { recursive: true });

            // Extract TS files
            for (const entry of tsEntries) {
                const rel = entry.entryName.substring("types/".length);
                const outPath = path.join(targetLibsDir, rel);
                fs.mkdirSync(path.dirname(outPath), { recursive: true });
                fs.writeFileSync(outPath, entry.getData());
            }

            // Compile to globalCacheDir for runtime resolve
            const targetCacheDir = path.join(globalCacheDir, modName);
            if (fs.existsSync(targetCacheDir)) fs.rmSync(targetCacheDir, { recursive: true, force: true });
            fs.mkdirSync(targetCacheDir, { recursive: true });

            // Try simple transpile using esbuild if available, or write mock package.json
            for (const entry of tsEntries) {
                const rel = entry.entryName.substring("types/".length);
                const outJSPath = path.join(targetCacheDir, rel.replace(/\.ts$/, '.js'));
                fs.mkdirSync(path.dirname(outJSPath), { recursive: true });
                
                // For runtime execution, compile the TS files
                try {
                    const { transformSync } = require('esbuild');
                    const res = transformSync(entry.getData().toString('utf8'), {
                        loader: 'ts',
                        format: 'cjs',
                        target: 'node18'
                    });
                    fs.writeFileSync(outJSPath, res.code, 'utf8');
                } catch (e) {
                    // fall back to write TS raw or simple module.exports
                    fs.writeFileSync(outJSPath, "module.exports = {};");
                }
            }
            fs.writeFileSync(path.join(targetCacheDir, 'package.json'), JSON.stringify({ name: modName, main: 'index.js' }, null, 2));

            // Update tsconfig.json paths mapping
            this.updateTsConfigPaths(modName, targetLibsDir);
        } catch (e) {
            console.error(`[Autotyping] .d.xext tip cikartma hatasi (${path.basename(filePath)}):`, e);
        }
    }

    private updateTsConfigPaths(moduleName: string, libsDir: string) {
        const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
        if (!fs.existsSync(tsconfigPath)) return;

        try {
            const raw = fs.readFileSync(tsconfigPath, "utf8");
            let config: any;
            try {
                config = JSON.parse(raw);
            } catch (jsonErr) {
                const cleaned = raw.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                config = JSON.parse(cleaned);
            }

            if (!config.compilerOptions) config.compilerOptions = {};
            if (!config.compilerOptions.paths) config.compilerOptions.paths = {};

            const absoluteLibsPath = libsDir.replace(/\\/g, "/");

            // Setup mappings to global lib TS folder index.ts
            config.compilerOptions.paths[moduleName] = [path.join(absoluteLibsPath, "index.ts").replace(/\\/g, "/")];
            config.compilerOptions.paths[`${moduleName}/*`] = [path.join(absoluteLibsPath, "*").replace(/\\/g, "/")];

            fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2), "utf8");
        } catch (e) {
            console.error(`[Autotyping] tsconfig.json guncelleme hatasi:`, e);
        }
    }
}


