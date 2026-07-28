/**
 * State icons and colors for module visualization
 */

import chalk from "chalk";
import type { ModuleState } from "../types";

export const STATE_ICONS: Readonly<Record<ModuleState, string>> = Object.freeze({
    ENABLED: '✔',
    DISABLED: '✖',
    FAILED: '⚠',
    LOADING: '⌛',
    RELOADING: '↻',
    UNKNOWN: '?'
});

export const STATE_COLORS: Readonly<Record<ModuleState, (text: string) => string>> = Object.freeze({
    ENABLED: chalk.green,
    DISABLED: chalk.red,
    FAILED: chalk.yellow,
    LOADING: chalk.cyan,
    RELOADING: chalk.blue,
    UNKNOWN: chalk.gray
});

export function getStateIcon(state: ModuleState): string {
    return STATE_ICONS[state] || STATE_ICONS.UNKNOWN;
}

export function getStateColor(state: ModuleState): (text: string) => string {
    return STATE_COLORS[state] || STATE_COLORS.UNKNOWN;
}

export function formatModuleState(moduleName: string, version: string, state: ModuleState): string {
    const icon = getStateIcon(state);
    const colorFn = getStateColor(state);
    return `${icon} ${colorFn(moduleName)} ${chalk.gray(version)}`;
}
