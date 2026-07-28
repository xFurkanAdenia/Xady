/**
 * WebPos Command - Main Entry Point
 */
import type WebPosModule from "../index";
type CommandExecutor = {
    onCommand(sender: any, command: any, label: string, args: readonly string[]): Promise<boolean> | boolean;
};
type SubCommand = {
    readonly name: string;
    readonly aliases: readonly string[];
    readonly description: string;
    readonly usage: string;
    execute(sender: any, args: readonly string[]): Promise<boolean> | boolean;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> | readonly string[];
};
export declare class WebPosCommandExecutor implements CommandExecutor {
    #private;
    constructor(module: WebPosModule, subcommands: SubCommand[]);
    onCommand(sender: any, command: any, label: string, args: readonly string[]): Promise<boolean>;
    onTabComplete(sender: any, command: any, label: string, args: string[]): Promise<string[]>;
    getModule(): WebPosModule;
}
export {};
