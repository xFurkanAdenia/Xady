import { Listener } from "./Listener";
import { XadyEvent } from "./XadyEvent";
import { EVENT_HANDLER_METADATA_KEY } from "./EventHandler";
import { Cancellable } from "./Cancellable";
import BaseModule from "../models/BaseModule";

import { activeModuleStorage } from "../context";

interface RegisteredListener {
    listener: Listener;
    method: Function; // Direct function reference
    priority: number;
    module: BaseModule | null;
}

export class EventManager {
    // EventName -> Array of RegisteredListeners (sorted)
    private handlers: Map<string, RegisteredListener[]> = new Map();

    // ModuleName -> Array of Listeners (for cleanup)
    private moduleListeners: Map<string, Listener[]> = new Map();
    
    // Metadata cache: Constructor -> Metadata
    private metadataCache: WeakMap<Function, any[]> = new WeakMap();
    
    // Chat Pattern Handlers cache: PatternName -> RegisteredListener[]
    private chatPatternHandlers: Map<string, RegisteredListener[]> = new Map();

    // Event Watchdog/Metrics
    public eventMetrics: Map<string, { count: number; totalDurationMs: number }> = new Map();


    registerEvents(listener: Listener, module: BaseModule | null) {
        // Safe provider verification: Ensure module is valid and registered
        if (module) {
            // Validate module context if registered through BaseModule
            const activeModule = activeModuleStorage.getStore();
            if (activeModule && activeModule !== module.getName()) {
                throw new Error(`Güvenlik Engeli: "${activeModule}" modülü, "${module.getName()}" modülü adına event kaydetmeye çalıştı!`);
            }
        }

        // Lazy metadata: cache after first read
        let handlersMeta = this.metadataCache.get(listener.constructor);
        if (!handlersMeta) {
            handlersMeta = Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, listener.constructor);
            if (!handlersMeta) return;
            this.metadataCache.set(listener.constructor, handlersMeta);
        }

        const moduleName = module ? module.getModuleManifest().getName() : "Built-in";
        if (!this.moduleListeners.has(moduleName)) {
            this.moduleListeners.set(moduleName, []);
        }

        // Prevent duplicate listener instances from the same module
        const existingListeners = this.moduleListeners.get(moduleName)!;
        
        // Find if there's already an instance of this listener class registered for this module
        // Also ensure we handle cross-context constructor name equality gracefully.
        const duplicateIndex = existingListeners.findIndex(l => {
            const currentName = l.constructor?.name;
            const newName = listener.constructor?.name;
            return currentName && newName && currentName === newName;
        });
        
        if (duplicateIndex !== -1) {
            // Unregister the old instance first to ensure clean state
            const oldListener = existingListeners[duplicateIndex];
            
            for (const [eventName, list] of this.handlers.entries()) {
                const filteredList = list.filter(r => r.listener !== oldListener);
                if (filteredList.length === 0) {
                    this.handlers.delete(eventName);
                } else {
                    this.handlers.set(eventName, filteredList);
                }
            }
            
            // Remove from the module's listener list
            existingListeners.splice(duplicateIndex, 1);
        }
        
        existingListeners.push(listener);

        let needsSort = false;
        
        for (const meta of handlersMeta) {
            const eventName = meta.eventClass.name;
            if (!this.handlers.has(eventName)) {
                this.handlers.set(eventName, []);
            }

            const list = this.handlers.get(eventName)!;
            
            // Direct function reference instead of method name
            const method = (listener as any)[meta.methodName];
            if (typeof method !== 'function') {
                console.error(`[EventManager] Method ${String(meta.methodName)} not found on listener`);
                continue;
            }

            // Fix: Check if this EXACT listener method is already registered in the handlers array
            // This prevents duplicate triggers if a module mistakenly registers the same listener multiple times
            if (list.some(r => r.listener === listener)) {
                continue;
            }
            
            const registered: RegisteredListener = {
                listener,
                method: method.bind(listener), // Bind to preserve context
                priority: meta.priority,
                module: module
            };
            list.push(registered);
            
            needsSort = true;
        }
        
        // Sort once after all handlers added
        if (needsSort) {
            for (const list of this.handlers.values()) {
                list.sort((a, b) => a.priority - b.priority);
            }
        }

        this.rebuildChatPatternHandlersCache();
        
        console.log(`[EventManager] Registered ${handlersMeta.length} event handler(s) for module: ${moduleName}`);
    }

    private rebuildChatPatternHandlersCache() {
        this.chatPatternHandlers.clear();
        const chatPatternListeners = this.handlers.get("ChatPatternEvent") || [];
        for (const registered of chatPatternListeners) {
            // Register them under pattern names for O(1) matching if specified
            const method = registered.listener.constructor.prototype;
            // Scan for custom pattern handlers or associate dynamically on call
        }
    }

    unregisterAll(module: BaseModule) {
        const moduleName = module.getModuleManifest().getName();
        if (!this.moduleListeners.has(moduleName)) return;

        const listenersToRemove = this.moduleListeners.get(moduleName)!;

        for (const [eventName, list] of this.handlers.entries()) {
            const filteredList = list.filter(r => !listenersToRemove.includes(r.listener));
            if (filteredList.length === 0) {
                this.handlers.delete(eventName);
            } else {
                this.handlers.set(eventName, filteredList);
            }
        }

        this.moduleListeners.delete(moduleName);
    }

    callEvent(event: XadyEvent): XadyEvent {
        const eventName = event.constructor.name;
        
        // 1. O(1) ChatPatternEvent optimized dispatch
        let list: RegisteredListener[] | undefined;
        if (eventName === 'ChatPatternEvent') {
            const patternName = (event as any).getPatternName();
            const owner = (event as any).getOwnerModule();
            const rawList = this.handlers.get(eventName) || [];
            // Daha sıkı filtreleme: Sadece pattern'in asıl sahibinin listener'ları çalışsın
            list = rawList.filter(registered => registered.module === owner);
            
            // Eğer hala duplicate (aynı class ve method'dan 2 tane) kalmışsa bunu da engelleyelim
            const uniqueList: RegisteredListener[] = [];
            const seenKeys = new Set<string>();
            for (const r of list) {
                const key = `${r.listener.constructor.name}:${r.method.name}`;
                if (!seenKeys.has(key)) {
                    seenKeys.add(key);
                    uniqueList.push(r);
                }
            }
            list = uniqueList;
            
        } else {
            list = this.handlers.get(eventName);
        }

        if (!list || list.length === 0) return event;

        const isCancellable = 'isCancelled' in event && typeof (event as any).isCancelled === 'function';

        for (const registered of list) {
            // Skip if cancelled (except MONITOR priority - 5)
            if (isCancellable && (event as any).isCancelled() && registered.priority !== 5) {
                continue;
            }
            
            const moduleName = registered.module ? registered.module.getModuleManifest().getName() : "Built-in";
            
            // Watchdog & Metrics
            const start = process.hrtime.bigint();
            try {
                // Run handler inside AsyncLocalStorage context representing the executing module
                if (registered.module) {
                    activeModuleStorage.run(registered.module.getName(), () => {
                        registered.method(event);
                    });
                } else {
                    registered.method(event);
                }
            } catch (e) {
                console.error(`[EventManager] Error passing event ${eventName} to module ${moduleName}`, e);
            } finally {
                const diff = process.hrtime.bigint() - start;
                const durationMs = Number(diff) / 1_000_000;
                
                // Record metrics
                let m = this.eventMetrics.get(moduleName);
                if (!m) {
                    m = { count: 0, totalDurationMs: 0 };
                    this.eventMetrics.set(moduleName, m);
                }
                m.count++;
                m.totalDurationMs += durationMs;

                // Watchdog threshold: 250ms blocking warning, 1000ms crash module disable
                if (durationMs > 250 && registered.module) {
                    console.warn(`[Watchdog] WARNING: "${moduleName}" modülü event "${eventName}" işlerken ${durationMs.toFixed(2)}ms gecikmeye sebep oldu.`);
                    if (durationMs > 1000) {
                        console.error(`[Watchdog] CRITICAL: "${moduleName}" modülü 1000ms limitini aştı (${durationMs.toFixed(2)}ms)! Güvenlik nedeniyle otomatik devre dışı bırakılıyor.`);
                        try {
                            registered.module.setEnabled(false);
                        } catch (disableErr) {
                            console.error(`Modül devre dışı bırakılırken hata:`, disableErr);
                        }
                    }
                }
            }
        }

        return event;
    }

    public clearAll() {
        this.handlers.clear();
        this.moduleListeners.clear();
        this.chatPatternHandlers.clear();
        this.eventMetrics.clear();
    }
}
