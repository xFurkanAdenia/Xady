/**
 * Payments SubCommand - List payments
 * Usage: !webpos payments [username]
 */
import type WebPosModule from "../index";
export declare class PaymentsSubCommand {
    #private;
    readonly name = "payments";
    readonly aliases: readonly string[];
    readonly description = "\u00D6demeleri listele";
    readonly usage = "!webpos payments [kullan\u0131c\u0131-ad\u0131]";
    constructor(module: WebPosModule);
    execute(sender: any, args: readonly string[]): Promise<boolean>;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]>;
}
