/**
 * Type definitions for Modules Command System
 */

import type CommandSender from "../../models/CommandSender";
import type { PluginCommand } from "../../command/PluginCommand";
import type Client from "../../classes/Client";
import type BaseModule from "../../models/BaseModule";

export interface SubCommandContext {
    readonly client: Client;
    readonly sender: CommandSender;
    readonly command: PluginCommand;
    readonly label: string;
    readonly args: readonly string[];
}

export interface SubCommand {
    readonly name: string;
    readonly aliases: readonly string[];
    readonly description: string;
    readonly usage: string;
    readonly permission: string;
    readonly examples: readonly string[];
    
    execute(context: SubCommandContext): Promise<boolean>;
    tabComplete(context: SubCommandContext): Promise<readonly string[]>;
}

export type ModuleState = 'ENABLED' | 'DISABLED' | 'FAILED' | 'LOADING' | 'RELOADING' | 'UNKNOWN';

export interface ModuleInfo {
    readonly name: string;
    readonly version: string;
    readonly state: ModuleState;
    readonly instance: BaseModule;
}

export interface ModuleMetrics {
    readonly count: number;
    readonly totalDurationMs: number;
    readonly avgDurationMs: number;
    readonly maxDurationMs: number;
}

export interface HealthReport {
    readonly moduleName: string;
    readonly state: ModuleState;
    readonly cpuTimeMs: number;
    readonly activeSchedulers: number;
    readonly chatPatterns: number;
    readonly registeredEvents: number;
    readonly registeredCommands: number;
    readonly memoryUsageMB: number;
    readonly issues: readonly HealthIssue[];
}

export interface HealthIssue {
    readonly severity: 'CRITICAL' | 'WARNING' | 'INFO';
    readonly type: string;
    readonly message: string;
}

export interface DependencyGraph {
    readonly moduleName: string;
    readonly dependencies: readonly string[];
    readonly softDependencies: readonly string[];
    readonly reverseDependencies: readonly string[];
}
