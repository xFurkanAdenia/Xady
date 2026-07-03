import readline from "readline";
import chalk from "chalk";
import path from "path";
import Client from "../classes/Client";
import { SettingsManager, SettingsItem, SettingsCategory } from "../classes/SettingsManager";
import { ConsoleCommandEvent } from "../event/xady/ConsoleCommandEvent";
import { ConsoleChatEvent } from "../event/xady/ConsoleChatEvent";
import { command, error, xady } from "../utils/prefix";

export class CliManager {
  private rl: readline.Interface;
  private client?: Client;
  private settingsManager: SettingsManager;

  private tabCache = new Map<string, { at: number; hits: string[] }>();
  private tabCacheTtlMs = 2000;
  private slashRequestSeq = 0;
  private lastSlashFetchAt = 0;
  private bangRequestSeq = 0;

  private completionPanel = { active: false, rows: 0 };
  
  private settingsMenuView: any = null;
  private settingsMenuPanel = { active: false, rows: 0 };
  private savedCliPrompt: string | null = null;
  private settingsMenuIgnoreEnterUntil = 0;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    
    this.settingsManager.onPromptChange = (newPrompt: string) => {
        if (!this.settingsMenuView) {
            this.rl.setPrompt(chalk.green(newPrompt));
            this.rl.prompt(true);
        }
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green(this.settingsManager.getConfig().cli.prompt),
      completer: this.completer.bind(this)
    });

    process.stdin.on("keypress", (str, key) => {
        if (this.settingsMenuView) {
            this.handleKeypress(str, key);
        }
    });

    // Initialize console output interception
    this.interceptConsoleOutput();

    this.rl.on("line", this.handleLine.bind(this));
    this.rl.on("SIGINT", () => this.rl.close());
  }

  private interceptConsoleOutput() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    const rewriteConsole = (originalFn: Function) => {
      return (...args: any[]) => {
        // Eğer ayarlar menüsü açıksa hiçbir şeyi ekrana bastırma (çıktıları yut)
        if (this.settingsMenuView) return;

        // Normal log basma işlemi (Satırı temizle, mesajı bas, prompt'u alta al)
        const output = (this.rl as any).output as any;
        if (output && output.isTTY) {
          readline.clearLine(output, 0);
          readline.cursorTo(output, 0);
        }
        
        originalFn.apply(console, args);
        
        // Eğer menüde değilsek ve completion açık değilse prompt'u yeniden çiz
        if (!this.settingsMenuView && !this.completionPanel.active) {
          this.rl.prompt(true);
        }
      };
    };

    console.log = rewriteConsole(originalLog);
    console.warn = rewriteConsole(originalWarn);
    console.error = rewriteConsole(originalError);
    console.info = rewriteConsole(originalInfo);
  }

  setClient(client: Client) {
    this.client = client;
  }

  getReadline() {
    return this.rl;
  }

  private handleLine(input: string) {
    if (this.settingsMenuView) {
      (this.rl as any).line = "";
      (this.rl as any).cursor = 0;
      this.drawSettingsMenu();
      return;
    }
    
    this.clearCompletionPanel();
    this.removeSubmittedInput(input);

    if (input.trim().length < 1) {
      this.rl.prompt(true);
      return;
    }

    if (input.startsWith("!")) {
      const parts = input.trim().split(/\s+/);
      const cmdName = parts[0]!.substring(1).toLowerCase();
      const args = parts.slice(1);

      const commandEvent = new ConsoleCommandEvent(cmdName, args);
      this.client?.getEventManager().callEvent(commandEvent);

      if (commandEvent.isCancelled()) {
        this.rl.prompt(true);
        return;
      }

      const commandObj = this.client?.getCommandManager().getCommand(cmdName);
      if (!commandObj) {
        console.log(
          xady + error,
          chalk.yellowBright(cmdName),
          chalk.redBright("adında bir komut bulunamadı!"),
        );
        this.rl.prompt(true);
        return;
      }
      
      const sender = this.client?.getConsoleCommandSender();
      if (!sender) return;
      
      commandObj.execute(sender, cmdName, args).then(() => {
          this.rl.prompt(true);
      });
      return;
    } else {
      const chatEvent = new ConsoleChatEvent(input);
      this.client?.getEventManager().callEvent(chatEvent);

      if (chatEvent.isCancelled()) {
        this.rl.prompt(true);
        return;
      }

      const bot = this.client?.getBot();
      if (bot) {
        // Minecraft 1.19.1+ chat signing gerektirebilir ama basitçe bot.chat yeterlidir.
        try {
          bot.chat(chatEvent.getMessage());
        } catch (e) {
          console.log(chalk.red("Bot henüz sunucuya tam bağlanmadı veya mesaj gönderilemiyor."));
        }
      } else {
        console.log(chalk.red("Bot henüz oyuna girmedi, mesaj gönderilemez!"));
      }
      this.rl.prompt(true);
    }
  }

  private completer(line: string, callback: any) {
    const currentClient = this.client;
    const { trimmedStart, currentToken } = this.tokenizeForCompletion(line);
    const token = currentToken.trim();

    if (trimmedStart.startsWith("!")) {
      this.clearCompletionPanel();
      const requestId = ++this.bangRequestSeq;
      const requestedLine = trimmedStart;
      const requestedToken = token;
      const endsWithSpace = /\s$/.test(line);
      const tokens = trimmedStart.trim().split(/\s+/).filter(Boolean);
      const first = tokens[0] ?? "!";
      const cmdName = first.startsWith("!") ? first.slice(1).toLowerCase() : "";

      const command = currentClient?.getCommandManager().getCommand(cmdName);
      if (command) {
          callback(null, [[], requestedToken]);
          queueMicrotask(async () => {
              if (requestId !== this.bangRequestSeq) return;
              const liveLine = String((this.rl as any).line ?? "");
              if (liveLine.trimStart() !== requestedLine) return;
              const sender = currentClient?.getConsoleCommandSender();
              if (!sender) return;

              const liveTokens = liveLine.trim().split(/\s+/).filter(Boolean);
              const args = liveTokens.slice(1);
              if (/\s$/.test(liveLine)) args.push("");

              try {
                  const hits = await command.tabComplete(sender, cmdName, args);
                  if (hits.length === 1) {
                      const h = hits[0] as string;
                      return this.applyInlineCompletion(h + (h.endsWith("/") ? "" : " "), requestedToken);
                  }
                  const lcp = this.longestCommonPrefix(hits);
                  if (lcp.length > requestedToken.length) {
                      return this.applyInlineCompletion(lcp, requestedToken);
                  }
                  if (hits.length > 1) {
                      this.showCompletionPanel(hits);
                  }
              } catch (e) {
                  // ignore
              }
          });
          return;
      }

      if (tokens.length > 1 || endsWithSpace) return callback(null, [[], requestedToken]);

      const bangToken = requestedToken || first || "!";
      const prefixValue = bangToken.slice(1).toLowerCase();
      
      const commandsMap = currentClient?.getCommandManager().getCommands();
      const availableCommands = new Set<string>();
      
      if (commandsMap) {
          for (const [cName, cmdList] of commandsMap.entries()) {
              availableCommands.add(cName);
              for (const cmd of cmdList) {
                  const modName = cmd.getModule()?.getName().toLowerCase() ?? "xady";
                  availableCommands.add(`${modName}:${cName}`);
              }
          }
      }

      const hits = Array.from(availableCommands)
        .filter(n => n.startsWith(prefixValue))
        .sort((a, b) => a.localeCompare(b))
        .map(n => `!${n}`);

      if (hits.length === 1) {
        if (hits[0] !== bangToken) this.applyInlineCompletion(hits[0] as string, bangToken);
        return callback(null, [[], bangToken]);
      }
      const lcp = this.longestCommonPrefix(hits);
      if (lcp.length > bangToken.length) {
        this.applyInlineCompletion(lcp, bangToken);
        return callback(null, [[], bangToken]);
      }
      if (hits.length > 1) this.showCompletionPanel(hits);
      return callback(null, [[], bangToken]);
    }

    if (trimmedStart.startsWith("/")) {
      const bot = currentClient?.getBot();
      if (!bot) return callback(null, [[], token]);

      const cacheKey = trimmedStart;
      const cached = this.tabCache.get(cacheKey);
      const now = Date.now();
      if (cached && now - cached.at < this.tabCacheTtlMs) {
        if (cached.hits.length > 1) this.showCompletionPanel(cached.hits);
        if (cached.hits.length === 1) {
          if (cached.hits[0] !== token) this.applyInlineCompletion(cached.hits[0] as string, token);
          return callback(null, [[], token]);
        }
        const lcp = this.longestCommonPrefix(cached.hits);
        if (lcp.length > token.length) {
          this.applyInlineCompletion(lcp, token);
          return callback(null, [[], token]);
        }
        return callback(null, [[], token]);
      }

      const minIntervalMs = 150;
      if (now - this.lastSlashFetchAt < minIntervalMs) return callback(null, [[], token]);
      this.lastSlashFetchAt = now;

      const requestId = ++this.slashRequestSeq;
      const requestedLine = trimmedStart;
      const requestedToken = token;
      const completingCommand = requestedLine.split(/\s+/).length <= 1;

      callback(null, [[], token]);

      bot
        .tabComplete(requestedLine)
        .then((raw) => {
          if (requestId !== this.slashRequestSeq) return;
          const list = Array.isArray(raw) ? raw : [];
          const hits = list
            .map(this.extractCompletionText)
            .filter((v): v is string => typeof v === "string")
            .map(completingCommand ? this.normalizeSlashSuggestion : this.normalizeArgumentSuggestion)
            .filter((v): v is string => typeof v === "string")
            .filter(v => !requestedToken || v.toLowerCase().startsWith(requestedToken.toLowerCase()))
            .filter((v, idx, arr) => arr.indexOf(v) === idx)
            .sort((a, b) => a.localeCompare(b));

          this.tabCache.set(cacheKey, { at: Date.now(), hits });

          const liveLine = String((this.rl as any).line ?? "");
          if (liveLine.trimStart() !== requestedLine) return;

          if (hits.length === 1) {
            const h = hits[0] as string;
            return this.applyInlineCompletion(h + " ", requestedToken);
          }
          const lcp = this.longestCommonPrefix(hits);
          if (lcp.length > requestedToken.length) {
            return this.applyInlineCompletion(lcp, requestedToken);
          }
          if (hits.length > 1) {
            this.showCompletionPanel(hits);
          }
        })
        .catch(() => {});
      return;
    }

    callback(null, [[], token]);
  }

  // --- Completion Helpers ---
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

  private firstToken(text: string): string {
    return text.trim().split(/\s+/)[0] ?? "";
  }

  private normalizeSlashSuggestion = (text: string): string | null => {
    const token = this.firstToken(text);
    if (!token) return null;
    if (token.startsWith("//")) return token;
    if (token.startsWith("/")) return token;
    return `/${token}`;
  }

  private normalizeArgumentSuggestion = (text: string): string | null => {
    const token = this.firstToken(text);
    if (!token) return null;
    return token;
  }

  private replaceLastToken(currentLine: string, currentToken: string, replacement: string): string | null {
    if (!currentToken) return null;
    const idx = currentLine.lastIndexOf(currentToken);
    if (idx === -1) return null;
    if (idx + currentToken.length !== currentLine.length) return null;
    return currentLine.slice(0, idx) + replacement;
  }

  private tokenizeForCompletion(line: string): { trimmedStart: string; currentToken: string } {
    const trimmedStart = line.trimStart();
    const currentToken = /\s$/.test(line) ? "" : (line.match(/(\S+)$/)?.[1] ?? "");
    return { trimmedStart, currentToken };
  }

  private applyInlineCompletion(replacement: string, requestedToken: string) {
    const liveLine = String((this.rl as any).line ?? "");
    const nextLine = requestedToken ? this.replaceLastToken(liveLine, requestedToken, replacement) : liveLine + replacement;
    if (!nextLine) return;
    this.clearCompletionPanel();
    (this.rl as any).line = nextLine;
    (this.rl as any).cursor = this.stripAnsi(nextLine).length;
    this.rl.prompt(true);
  }

  private longestCommonPrefix(values: string[]): string {
    if (values.length === 0) return "";
    let prefix = values[0] ?? "";
    for (let i = 1; i < values.length; i++) {
      const v = values[i] ?? "";
      while (prefix && !v.startsWith(prefix)) {
        prefix = prefix.slice(0, -1);
      }
      if (!prefix) return "";
    }
    return prefix;
  }

  private stripAnsi(text: string): string {
    return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
  }

  private removeSubmittedInput(submittedInput: string) {
    const output = (this.rl as any).output as any;
    if (!output?.isTTY) return;

    const columns = Math.max(1, output.columns ?? process.stdout.columns ?? 80);
    const promptLen = this.stripAnsi(this.rl.getPrompt()).length;
    const inputLen = this.stripAnsi(submittedInput).length;
    const rows = Math.max(1, Math.ceil((promptLen + inputLen) / columns));

    readline.moveCursor(output, 0, -rows);
    readline.cursorTo(output, 0);

    for (let i = 0; i < rows; i++) {
      output.write("\x1b[2K");
      output.write("\x1b[1M");
    }

    output.write("\x1b[2K");
    readline.cursorTo(output, 0);
  }

  private measureTerminalRows(text: string, columns: number): number {
    const len = this.stripAnsi(text).length;
    return Math.max(1, Math.ceil(Math.max(1, len) / Math.max(1, columns)));
  }

  private formatInColumns(items: string[], columns: number): { lines: string[]; rows: number } {
    if (items.length === 0) return { lines: [], rows: 0 };

    const plainLengths = items.map(i => this.stripAnsi(i).length);
    const maxLen = Math.max(...plainLengths);
    const padding = 2;
    const colWidth = Math.min(columns, maxLen + padding);
    const colCount = Math.max(1, Math.floor(columns / Math.max(1, colWidth)));
    const rowCount = Math.ceil(items.length / colCount);

    const lines: string[] = [];
    let rows = 0;

    for (let r = 0; r < rowCount; r++) {
      let line = "";
      for (let c = 0; c < colCount; c++) {
        const idx = r + c * rowCount;
        if (idx >= items.length) continue;
        const item = items[idx] as string;
        const itemLen = this.stripAnsi(item).length;
        const pad = Math.max(0, colWidth - itemLen);
        const isLast = c === colCount - 1 || r + (c + 1) * rowCount >= items.length;
        line += isLast ? item : item + " ".repeat(pad);
      }
      line = line.trimEnd();
      lines.push(line);
      rows += this.measureTerminalRows(line, columns);
    }

    return { lines, rows };
  }

  private clearCompletionPanel() {
    const output = (this.rl as any)?.output as any;
    if (!this.completionPanel.active || this.completionPanel.rows <= 0 || !output?.isTTY) return;

    readline.moveCursor(output, 0, -this.completionPanel.rows);
    readline.cursorTo(output, 0);

    for (let i = 0; i < this.completionPanel.rows; i++) {
      output.write("\x1b[2K");
      output.write("\x1b[1M");
    }

    this.completionPanel.active = false;
    this.completionPanel.rows = 0;
    this.rl.prompt(true);
  }

  private showCompletionPanel(items: string[]) {
    const output = (this.rl as any)?.output as any;
    if (!output?.isTTY) return;

    this.clearCompletionPanel();

    const columns = Math.max(1, output.columns ?? process.stdout.columns ?? 80);
    const capped = items.slice(0, 80);
    const { lines, rows } = this.formatInColumns(capped, columns);
    if (lines.length === 0 || rows === 0) return;

    for (const line of lines) {
      readline.clearLine(output, 0);
      readline.cursorTo(output, 0);
      output.write(line + "\n");
    }

    this.completionPanel.active = true;
    this.completionPanel.rows = rows;
    this.rl.prompt(true);
  }

  // --- Settings Menu ---
  
  public isSettingsMenuOpen(): boolean {
    return this.settingsMenuView !== null;
  }

  public openSettingsMenu() {
    this.clearCompletionPanel();
    this.clearSettingsMenuPanel();
    this.settingsMenuView = { name: "root", selected: 0 };
    this.settingsMenuIgnoreEnterUntil = Date.now() + 200; // Artırıldı ki ilk enter algılanmasın
    this.savedCliPrompt = this.rl.getPrompt();
    this.rl.setPrompt("");
    (this.rl as any).line = "";
    (this.rl as any).cursor = 0;
    
    // Klavyeyi raw moda alarak stdin events'in direkt akmasını sağla
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
    }
    
    this.drawSettingsMenu();
  }

  private closeSettingsMenu() {
    this.settingsMenuView = null;
    this.clearSettingsMenuPanel();
    this.rl.setPrompt(this.savedCliPrompt ?? chalk.green(this.settingsManager.getConfig().cli.prompt));
    this.savedCliPrompt = null;
    
    // Raw modunu geri çevir (bazen readline kendisi düzeltse de emin olmak için)
    // if (process.stdin.isTTY) {
    //     process.stdin.setRawMode(false);
    // }
    
    // Satırı temizleyip prompt'u bas
    (this.rl as any).line = "";
    (this.rl as any).cursor = 0;
    this.rl.prompt(true);
  }

  private clearSettingsMenuPanel() {
    const output = (this.rl as any)?.output as any;
    if (!this.settingsMenuPanel.active || this.settingsMenuPanel.rows <= 0 || !output?.isTTY) return;

    readline.moveCursor(output, 0, -this.settingsMenuPanel.rows);
    readline.cursorTo(output, 0);

    for (let i = 0; i < this.settingsMenuPanel.rows; i++) {
      output.write("\x1b[2K");
      output.write("\x1b[1M");
    }

    this.settingsMenuPanel.active = false;
    this.settingsMenuPanel.rows = 0;
  }

  private renderSettingsMenu(lines: string[]) {
    const output = (this.rl as any)?.output as any;
    if (!output?.isTTY) return;

    const columns = Math.max(1, output.columns ?? process.stdout.columns ?? 80);
    let rows = 0;
    for (const line of lines) {
      const safe = line ?? "";
      rows += this.measureTerminalRows(safe, columns);
    }

    const canFastRedraw = this.settingsMenuPanel.active && this.settingsMenuPanel.rows === rows && rows > 0;
    if (canFastRedraw) {
      readline.moveCursor(output, 0, -rows);
      readline.cursorTo(output, 0);
    } else {
      this.clearSettingsMenuPanel();
    }

    for (const line of lines) {
      const safe = line ?? "";
      readline.clearLine(output, 0);
      readline.cursorTo(output, 0);
      output.write(safe + "\n");
    }

    this.settingsMenuPanel.active = true;
    this.settingsMenuPanel.rows = rows;
    readline.clearLine(output, 0);
    readline.cursorTo(output, 0);
  }

  private getSettingsCategories(): { id: string; title: string }[] {
    const builtIn = [
      { id: "bot", title: "Bağlantı" },
      { id: "cli", title: "CLI" },
      { id: "performance", title: "Performans" },
      { id: "proxy", title: "Proxy" }
    ];
    const extra = this.settingsManager.getRegisteredCategories() ?? [];
    const extras = extra.map(c => ({ id: `ext:${c.id}`, title: c.title }));
    return [...builtIn, ...extras];
  }

  private getByPath(obj: unknown, keyPath: string): unknown {
      const parts = keyPath.split(".").filter(Boolean);
      let cur: unknown = obj;
      for (const p of parts) {
        if (!cur || typeof cur !== "object") return undefined;
        cur = (cur as Record<string, unknown>)[p];
      }
      return cur;
  }

  private getCategoryItems(categoryId: string): SettingsItem[] {
    if (categoryId === "bot") {
      return [
        { kind: "string", keyPath: "bot.username", label: "Username" },
        { kind: "string", keyPath: "bot.host", label: "Host" },
        { kind: "number", keyPath: "bot.port", label: "Port" },
        { kind: "string", keyPath: "bot.version", label: "Version" },
        { kind: "number", keyPath: "bot.reconnectDelay", label: "Yeniden Bağlanma Süresi (ms)" },
        { kind: "number", keyPath: "bot.maxReconnectAttempts", label: "Max Bağlanma Denemesi (-1: Sınırsız)" }
      ];
    }
    if (categoryId === "cli") {
      return [
        { kind: "string", keyPath: "cli.prompt", label: "Prompt" }
      ];
    }
    if (categoryId === "performance") {
      return [
        { kind: "boolean", keyPath: "performance.enabled", label: "Çoklu İşlemci (Worker Pool) Aktif Mi?" },
        { kind: "number", keyPath: "performance.maxWorkers", label: `Max Worker Threads (CPU count: ${require("os").cpus().length})` },
        { kind: "string", keyPath: "performance.cpuAffinity", label: "CPU Affinity (e.g. all, or 0,1)" }
      ];
    }
    if (categoryId === "proxy") {
      return [
        { kind: "boolean", keyPath: "bot.proxy.enabled", label: "Proxy Enabled" },
        { kind: "select", keyPath: "bot.proxy.type", label: "Proxy Type", options: ["socks5", "socks4", "http", "https"] },
        { kind: "string", keyPath: "bot.proxy.host", label: "Proxy Host" },
        { kind: "number", keyPath: "bot.proxy.port", label: "Proxy Port" },
        { kind: "string", keyPath: "bot.proxy.username", label: "Proxy Username" },
        { kind: "string", keyPath: "bot.proxy.password", label: "Proxy Password" }
      ];
    }
    if (categoryId.startsWith("ext:")) {
      const id = categoryId.slice("ext:".length);
      const found = this.settingsManager.getRegisteredCategories().find(c => c.id === id);
      return found?.items ?? [];
    }
    return [];
  }

  private formatItemValue(item: SettingsItem): string {
    const cfg = this.settingsManager.getConfig();
    const val = this.getByPath(cfg, item.keyPath);
    if (item.kind === "boolean") return val ? "Açık" : "Kapalı";
    if (val === undefined || val === null) return "";
    return String(val);
  }

  private drawSettingsMenu() {
    if (!this.settingsMenuView) return;

    const header = chalk.cyanBright("Ayarlar") + chalk.gray("  (↑↓ seç, Enter aç/düzenle, Esc geri/çık)");

    if (this.settingsMenuView.name === "root") {
      const cats = this.getSettingsCategories();
      const selected = Math.max(0, Math.min(this.settingsMenuView.selected, cats.length - 1));
      this.settingsMenuView.selected = selected;
      const lines = [
        header,
        ""
      ];
      for (let i = 0; i < cats.length; i++) {
        const c = cats[i]!;
        const prefix = i === selected ? chalk.green("> ") : "  ";
        lines.push(prefix + c.title);
      }
      this.renderSettingsMenu(lines);
      return;
    }

    if (this.settingsMenuView.name === "category") {
      const categoryId = this.settingsMenuView.categoryId;
      const items = this.getCategoryItems(categoryId);
      const selected = Math.max(0, Math.min(this.settingsMenuView.selected, Math.max(0, items.length - 1)));
      this.settingsMenuView.selected = selected;

      const title = this.getSettingsCategories().find(c => c.id === categoryId)?.title ?? categoryId;
      const lines = [
        header,
        chalk.gray(`Kategori: ${title}`),
        ""
      ];

      for (let i = 0; i < items.length; i++) {
        const it = items[i]!;
        const prefix = i === selected ? chalk.green("> ") : "  ";
        const value = this.formatItemValue(it);
        lines.push(prefix + `${it.label}: ${chalk.yellow(value)}`);
      }

      this.renderSettingsMenu(lines);
      return;
    }

    if (this.settingsMenuView.name === "edit") {
      const it = this.settingsMenuView.item;
      const lines = [
        header,
        chalk.gray(`Düzenle: ${it.label} (${it.kind})`),
        "",
        chalk.yellow(this.settingsMenuView.buffer),
        "",
        chalk.gray("Enter: kaydet  Esc: iptal")
      ];
      this.renderSettingsMenu(lines);
      return;
    }
  }

  private saveSettingItem(item: SettingsItem, raw: string) {
    if (item.kind === "string") {
      this.settingsManager.set(item.keyPath, raw);
      if (item.keyPath === "cli.prompt") {
        this.rl.setPrompt(chalk.green(this.settingsManager.getConfig().cli.prompt));
        if (!this.settingsMenuView) {
          this.rl.prompt(true);
        }
      }
      return;
    }
    if (item.kind === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) return;
      this.settingsManager.set(item.keyPath, n);
      return;
    }
    if (item.kind === "boolean") {
      const current = Boolean(this.getByPath(this.settingsManager.getConfig(), item.keyPath));
      this.settingsManager.set(item.keyPath, !current);
      return;
    }
    if (item.kind === "select") {
      if (!item.options.includes(raw)) return;
      this.settingsManager.set(item.keyPath, raw);
    }
  }

  public handleKeypress(str: string, key: any) {
    if (!this.settingsMenuView) return false;

    // Prevent default readline behaviors when menu is open
    if (this.rl && (this.rl as any).line !== undefined) {
        (this.rl as any).line = "";
        (this.rl as any).cursor = 0;
    }

    const name = key?.name;
    if ((name === "return" || name === "enter" || name === "right") && Date.now() < this.settingsMenuIgnoreEnterUntil) {
      return true;
    }
    if (this.settingsMenuView.name === "edit") {
      if (name === "escape") {
        this.settingsMenuView = this.settingsMenuView.returnTo;
        this.drawSettingsMenu();
        return true;
      }
      if (name === "return" || name === "enter") {
        this.saveSettingItem(this.settingsMenuView.item, this.settingsMenuView.buffer);
        this.settingsMenuView = this.settingsMenuView.returnTo;
        this.drawSettingsMenu();
        return true;
      }
      if (name === "backspace") {
        this.settingsMenuView.buffer = this.settingsMenuView.buffer.slice(0, -1);
        this.drawSettingsMenu();
        return true;
      }
      if (key?.ctrl && name === "u") {
        this.settingsMenuView.buffer = "";
        this.drawSettingsMenu();
        return true;
      }
      if (typeof str === "string" && str.length === 1 && !key?.ctrl && !key?.meta) {
        this.settingsMenuView.buffer += str;
        this.drawSettingsMenu();
        return true;
      }
      return true;
    }

    if (name === "escape") {
      if (this.settingsMenuView.name === "root") {
        this.closeSettingsMenu();
        return true;
      }
      this.settingsMenuView = { name: "root", selected: 0 };
      this.drawSettingsMenu();
      return true;
    }

    if (name === "up") {
      this.settingsMenuView.selected = Math.max(0, this.settingsMenuView.selected - 1);
      this.drawSettingsMenu();
      return true;
    }
    if (name === "down") {
      this.settingsMenuView.selected = this.settingsMenuView.selected + 1;
      this.drawSettingsMenu();
      return true;
    }

    if (name === "return" || name === "enter" || name === "right") {
      if (this.settingsMenuView.name === "root") {
        const cats = this.getSettingsCategories();
        const selected = cats[Math.max(0, Math.min(this.settingsMenuView.selected, cats.length - 1))];
        if (!selected) return true;
        this.settingsMenuView = { name: "category", categoryId: selected.id, selected: 0 };
        this.drawSettingsMenu();
        return true;
      }

      if (this.settingsMenuView.name === "category") {
        const items = this.getCategoryItems(this.settingsMenuView.categoryId);
        const it = items[Math.max(0, Math.min(this.settingsMenuView.selected, Math.max(0, items.length - 1)))];
        if (!it) return true;
        if (it.kind === "boolean") {
          this.saveSettingItem(it, "");
          this.drawSettingsMenu();
          return true;
        }
        if (it.kind === "select") {
          const current = String(this.getByPath(this.settingsManager.getConfig(), it.keyPath) ?? "");
          const idx = Math.max(0, it.options.indexOf(current));
          const next = it.options[(idx + 1) % it.options.length] ?? it.options[0];
          if (next) this.saveSettingItem(it, next);
          this.drawSettingsMenu();
          return true;
        }
        const current = String(this.getByPath(this.settingsManager.getConfig(), it.keyPath) ?? "");
        this.settingsMenuView = { name: "edit", returnTo: this.settingsMenuView, item: it, buffer: current };
        this.drawSettingsMenu();
        return true;
      }
    }

    if (name === "left" || name === "backspace") {
      if (this.settingsMenuView.name === "root") {
        this.closeSettingsMenu();
        return true;
      }
      this.settingsMenuView = { name: "root", selected: 0 };
      this.drawSettingsMenu();
      return true;
    }

    return true;
  }
}
