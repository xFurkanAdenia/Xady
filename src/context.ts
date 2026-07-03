import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Xady Bot Framework - Core Context Storage
 * activeModuleStorage, hangi modülün çalıştığını izlemek için kullanılır.
 */
export const activeModuleStorage = new AsyncLocalStorage<string>();
