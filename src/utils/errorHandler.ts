import chalk from "chalk";
import Client from "../classes/Client";
import { error, module, xady } from "./prefix";

export function setupGlobalErrorHandler(getClient: () => Client | undefined) {
  function handleGlobalError(err: Error | unknown) {
    const client = getClient();
    if (!client) {
      console.error(chalk.red("Kritik Hata (İstemci Başlamadan Önce):"), err);
      return;
    }
    
    const errorObj = err instanceof Error ? err : new Error(String(err));
    const stack = errorObj.stack || "";
    
    const moduleManager = client.getModuleManager();
    let guiltyModule: string | null = null;
    
    for (const [name, mod] of moduleManager.getModules().entries()) {
      const execDir = mod.getExecDir();
      if (execDir && stack.includes(execDir)) {
        guiltyModule = name;
        break;
      }
    }
    
    if (guiltyModule) {
      console.error(xady + module + chalk.red(`[HATA] "${guiltyModule}" modülü bir hata fırlattı ve otomatik olarak kapatıldı:`));
      console.error(chalk.yellow(stack));
      
      const mod = moduleManager.getModules().get(guiltyModule);
      if (mod && mod.getEnabled()) {
        try {
          mod.setEnabled(false);
        } catch (e) {
          console.error(chalk.red(`"${guiltyModule}" modülü kapatılırken de hata verdi:`), e);
        }
      }
    } else {
      console.error(xady + error + chalk.red(" Beklenmeyen Çekirdek Hatası:"));
      console.error(chalk.yellow(stack));
    }
  }

  process.on("uncaughtException", handleGlobalError);
  process.on("unhandledRejection", (reason) => handleGlobalError(reason));
}
