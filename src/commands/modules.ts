/**
 * Module Management Console - Entry Point
 * 
 * Professional module management system inspired by Paper PluginManager,
 * PlugMan, Spark, Bukkit Timings, Docker CLI, and systemctl.
 */

import type Client from "../classes/Client";
import registerModulesCommands from "./modules/ModulesCommand";

export type SettingsApiLike = {
    getConfig: () => Record<string, unknown>;
    set: (keyPath: string, value: unknown) => void;
};

export default function initializeModulesCommand(client: Client, settings: SettingsApiLike): void {
    registerModulesCommands(client, settings);
}
