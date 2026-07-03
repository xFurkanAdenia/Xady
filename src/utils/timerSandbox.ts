import Client from "../classes/Client";
import { activeModuleStorage } from "../context";

export function setupTimerSandbox(getClient: () => Client | undefined) {
  const originalSetTimeout = global.setTimeout;
  const originalSetInterval = global.setInterval;
  const originalClearTimeout = global.clearTimeout;
  const originalClearInterval = global.clearInterval;

  (global as any).setTimeout = function(callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    const moduleName = activeModuleStorage.getStore();
    const client = getClient();
    if (moduleName && client) {
      const mod = client.getModuleManager().getModules().get(moduleName);
      if (mod) {
        let t: NodeJS.Timeout;
        const wrappedCallback = (...cbArgs: any[]) => {
          (mod as any).trackedTimeouts?.delete(t);
          callback(...cbArgs);
        };
        t = originalSetTimeout(wrappedCallback, ms, ...args);
        (mod as any).trackedTimeouts?.add(t);
        return t;
      }
    }
    return originalSetTimeout(callback, ms, ...args);
  } as any;

  (global as any).setInterval = function(callback: (...args: any[]) => void, ms?: number, ...args: any[]) {
    const moduleName = activeModuleStorage.getStore();
    const client = getClient();
    const t = originalSetInterval(callback, ms, ...args);
    if (moduleName && client) {
      const mod = client.getModuleManager().getModules().get(moduleName);
      if (mod) {
        (mod as any).trackedIntervals?.add(t);
      }
    }
    return t;
  } as any;

  (global as any).clearTimeout = function(timeoutId: NodeJS.Timeout | string | number | undefined) {
    if (timeoutId) {
      const moduleName = activeModuleStorage.getStore();
      const client = getClient();
      if (moduleName && client) {
        const mod = client.getModuleManager().getModules().get(moduleName);
        if (mod) (mod as any).trackedTimeouts?.delete(timeoutId);
      }
    }
    originalClearTimeout(timeoutId);
  } as any;

  (global as any).clearInterval = function(intervalId: NodeJS.Timeout | string | number | undefined) {
    if (intervalId) {
      const moduleName = activeModuleStorage.getStore();
      const client = getClient();
      if (moduleName && client) {
        const mod = client.getModuleManager().getModules().get(moduleName);
        if (mod) (mod as any).trackedIntervals?.delete(intervalId);
      }
    }
    originalClearInterval(intervalId);
  } as any;
}
