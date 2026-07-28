/**
 * Module utility functions
 */

import type Client from "../../../classes/Client";
import type BaseModule from "../../../models/BaseModule";
import type { ModuleState, ModuleInfo, ModuleMetrics, DependencyGraph } from "../types";

export function getModuleState(module: BaseModule): ModuleState {
    try {
        if (module.isEnabled()) return 'ENABLED';
        return 'DISABLED';
    } catch (e) {
        return 'FAILED';
    }
}

export function getAllModules(client: Client): readonly ModuleInfo[] {
    const modules = client.getModuleManager().getModules();
    const result: ModuleInfo[] = [];
    
    for (const [name, instance] of modules) {
        result.push({
            name,
            version: instance.getDescription().getVersion(),
            state: getModuleState(instance),
            instance
        });
    }
    
    return Object.freeze(result);
}

export function findModule(client: Client, nameOrAlias: string): BaseModule | undefined {
    const modules = client.getModuleManager().getModules();
    const searchTerm = nameOrAlias.toLowerCase();
    
    for (const [name, instance] of modules) {
        if (name.toLowerCase() === searchTerm) {
            return instance;
        }
    }
    
    return undefined;
}

export function getModuleMetrics(client: Client, moduleName: string): ModuleMetrics {
    const eventManager = client.getEventManager() as {
        eventMetrics?: Map<string, { count: number; totalDurationMs: number }>;
    };
    
    const metrics = eventManager.eventMetrics?.get(moduleName);
    
    if (!metrics) {
        return Object.freeze({
            count: 0,
            totalDurationMs: 0,
            avgDurationMs: 0,
            maxDurationMs: 0
        });
    }
    
    return Object.freeze({
        count: metrics.count,
        totalDurationMs: metrics.totalDurationMs,
        avgDurationMs: metrics.count > 0 ? metrics.totalDurationMs / metrics.count : 0,
        maxDurationMs: 0 // TODO: Track max duration
    });
}

export function buildDependencyGraph(client: Client, moduleName: string): DependencyGraph {
    const module = findModule(client, moduleName);
    if (!module) {
        return Object.freeze({
            moduleName,
            dependencies: Object.freeze([]),
            softDependencies: Object.freeze([]),
            reverseDependencies: Object.freeze([])
        });
    }
    
    const manifest = module.getDescription();
    const dependencies = manifest.getDependencies() || [];
    const softDependencies = manifest.getSoftDependencies() || [];
    
    // Find reverse dependencies
    const allModules = client.getModuleManager().getModules();
    const reverseDeps: string[] = [];
    
    for (const [name, mod] of allModules) {
        const modManifest = mod.getDescription();
        const deps = [
            ...(modManifest.getDependencies() || []),
            ...(modManifest.getSoftDependencies() || [])
        ];
        
        if (deps.includes(moduleName)) {
            reverseDeps.push(name);
        }
    }
    
    return Object.freeze({
        moduleName,
        dependencies: Object.freeze([...dependencies]),
        softDependencies: Object.freeze([...softDependencies]),
        reverseDependencies: Object.freeze(reverseDeps)
    });
}

export function getLoadOrder(client: Client): readonly string[] {
    const modules = client.getModuleManager().getModules();
    const visited = new Set<string>();
    const result: string[] = [];
    
    function visit(name: string, stack = new Set<string>()): void {
        if (visited.has(name)) return;
        
        const module = modules.get(name);
        if (!module) return;
        
        if (stack.has(name)) {
            // Circular dependency detected
            return;
        }
        
        stack.add(name);
        
        const manifest = module.getDescription();
        const dependencies = manifest.getDependencies() || [];
        
        for (const dep of dependencies) {
            visit(dep, stack);
        }
        
        stack.delete(name);
        visited.add(name);
        result.push(name);
    }
    
    for (const name of modules.keys()) {
        visit(name);
    }
    
    return Object.freeze(result);
}

export function startsWithIgnoreCase(value: string, prefix: string): boolean {
    return value.toLowerCase().startsWith(prefix.toLowerCase());
}

export function filterModulesByPrefix(modules: readonly string[], prefix: string): readonly string[] {
    return modules.filter(m => startsWithIgnoreCase(m, prefix));
}

export function sortModules(modules: readonly string[]): readonly string[] {
    return [...modules].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function getModuleExportedServices(module: BaseModule): readonly string[] {
    // BaseModule doesn't expose #exports map, so we return empty array
    // In the future, BaseModule could add getExportedServices() method
    // For now, services are tracked in ServiceManager, not in module manifest
    return Object.freeze([]);
}
