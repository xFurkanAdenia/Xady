import "reflect-metadata";
import path from "path";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Client from "./classes/Client";
import "./types"
import readline from "readline";
import { format } from "node:util";
import chalk from "chalk";
import { command, error, event, success, xady, module } from "./utils/prefix";
import Event from "./models/Event";
import Command from "./models/Command";
import ConsoleCommandSender from "./models/ConsoleCommandSender";
import CommandSender from "./models/CommandSender";
import registerBuiltInCommands from "./commands";
import { XadyEvent } from "./event/XadyEvent";
import { EventPriority } from "./event/EventPriority";
import { EventHandler } from "./event/EventHandler";
import { Listener } from "./event/Listener";
import { Cancellable } from "./event/Cancellable";
import * as MineflayerEvents from "./event/mineflayer/EventRegistry";
import { PluginCommand } from "./command/PluginCommand";
import { ServicePriority } from "./classes/ServiceManager";
import { ConsoleCommandEvent } from "./event/xady/ConsoleCommandEvent";
import { ConsoleChatEvent } from "./event/xady/ConsoleChatEvent";
import { ChatPatternEvent } from "./event/xady/ChatPatternEvent";
import { activeModuleStorage } from "./context";
import XadyModule, { BaseModule } from "./models/BaseModule";
import AppDataManager from "./utils/appdata";
import { AsyncLocalStorage } from "async_hooks";
import { XadyScheduler } from "./classes/XadyScheduler";
import { WorkerPool, TaskPriority } from "./classes/WorkerPool";
import { FileConfiguration } from "./classes/FileConfiguration";
import { SettingsManager, createSettingsProxy } from "./classes/SettingsManager";
import { setupTimerSandbox } from "./utils/timerSandbox";
import { setupGlobalErrorHandler } from "./utils/errorHandler";
import { ChatCommandListener } from "./event/xady/ChatCommandListener";

globalThis.Xady = {
  Command,
  CommandSender,
  ConsoleCommandSender,
  Module: XadyModule,
  BaseModule: BaseModule, // Deprecated
  Event: Event,
  XadyEvent,
  EventPriority,
  EventHandler,
  ServicePriority,
  WorkerPool: WorkerPool,
  TaskPriority: TaskPriority,
  FileConfiguration: FileConfiguration,
  PluginCommand,
  ModuleCommand: PluginCommand, // Alias
  events: MineflayerEvents,
  settings: undefined as any,
  prefix: {
    xady, error, success, command, event, module
  }
}


// Freeze the API objects to prevent module modifications
Object.freeze(globalThis.Xady.prefix);
Object.freeze(MineflayerEvents);


let client: Client | undefined;

setupTimerSandbox(() => client);
setupGlobalErrorHandler(() => client);

const tabCache = new Map<string, { at: number; hits: string[] }>();
const tabCacheTtlMs = 2000;
let slashRequestSeq = 0;
let lastSlashFetchAt = 0;
let bangRequestSeq = 0;

const settingsManager = new SettingsManager(AppDataManager.getConfigFile());
const settingsProxy = createSettingsProxy(settingsManager.getApi());
(globalThis.Xady as any).settings = settingsProxy;

import { CliManager } from "./cli/CliManager";
const cliManager = new CliManager(settingsManager);

client = new Client(__dirname);
cliManager.setClient(client);


registerBuiltInCommands(client, settingsManager.getApi(), () => cliManager.openSettingsMenu());


// Freeze the main Xady container itself (classes frozen, settings proxy cannot be replaced)
Object.freeze(globalThis.Xady);
Object.freeze(Client.prototype);
Object.freeze(BaseModule.prototype);
Object.freeze(XadyEvent.prototype);
Object.freeze(ChatPatternEvent.prototype);

import { EventManager } from "./event/EventManager";
import ModuleManager from "./classes/ModuleManager";
import CommandManager from "./classes/CommandManager";
import { ServiceManager } from "./classes/ServiceManager";

Object.freeze(EventManager.prototype);
Object.freeze(ModuleManager.prototype);
Object.freeze(CommandManager.prototype);
Object.freeze(ServiceManager.prototype);
client.getEventManager().registerEvents(new ChatCommandListener(() => client), null);

// AppData: İlk kurulumda default modülleri kopyala (sadece production'da ve ilk kez)
if (!AppDataManager.isDevMode()) {
  const embeddedModules = path.join(__dirname, "modules");
  if (existsSync(embeddedModules)) {
    AppDataManager.copyDefaultModules(embeddedModules);
  }
}

// Initialize workerpool & scheduler with configuration values
const perfCfg = settingsManager.getConfig().performance;
WorkerPool.getInstance().init(perfCfg.enabled, perfCfg.maxWorkers, perfCfg.cpuAffinity);
XadyScheduler.getInstance(); // Trigger lazy instantiation

// Modülleri yükle (dev: dist/modules, prod: AppData/modules)
const modulesPath = AppDataManager.getModulesDirectory();
console.log(chalk.gray(`[Xady] Modüller yükleniyor: ${modulesPath}`));
client.getModuleManager().loadModules(modulesPath);

// Modüller yüklendi, bot'u başlat
const botCfg = settingsManager.getConfig().bot;
client.startBot({
  username: botCfg.username,
  host: botCfg.host,
  port: botCfg.port,
  version: botCfg.version,
  hideErrors: false,
  keepAlive: true,
  checkTimeoutInterval: 60 * 1000
});




cliManager.getReadline().on("close", () => {
  client?.getModuleManager().getModules().forEach((val) => {
    if (val.onDisable) val.onDisable();
  });
  console.log("Güle Güle!");
  process.exit(0);
});

