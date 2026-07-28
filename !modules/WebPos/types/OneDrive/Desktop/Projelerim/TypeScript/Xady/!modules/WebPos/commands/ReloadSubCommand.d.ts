/**
 * Reload SubCommand - Reload WebPos configuration
 * Usage: !webpos reload
 */
import type WebPosModule from "../index";
export declare class ReloadSubCommand {
    #private;
    readonly name = "reload";
    readonly aliases: readonly string[];
    readonly description = "Config yeniden y\u00FCkle";
    readonly usage = "!webpos reload";
    constructor(module: WebPosModule);
    execute(sender: any, args: readonly string[]): Promise<boolean>;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]>;
}
