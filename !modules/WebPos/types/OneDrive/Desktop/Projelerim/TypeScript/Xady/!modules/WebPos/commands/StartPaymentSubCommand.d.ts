/**
 * StartPayment SubCommand - Create new payment
 * Usage: !webpos startPayment <payer> <receiver|-> <amount>
 */
import type WebPosModule from "../index";
export declare class StartPaymentSubCommand {
    #private;
    readonly name = "startPayment";
    readonly aliases: readonly string[];
    readonly description = "Yeni \u00F6deme olu\u015Ftur";
    readonly usage = "!webpos startPayment <\u00F6deme-yapacak> <alacak-ki\u015Fi|-> <miktar>";
    constructor(module: WebPosModule);
    execute(sender: any, args: readonly string[]): Promise<boolean>;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]>;
}
