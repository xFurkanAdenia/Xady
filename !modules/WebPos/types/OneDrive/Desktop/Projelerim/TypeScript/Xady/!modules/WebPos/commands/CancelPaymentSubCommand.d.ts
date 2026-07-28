/**
 * CancelPayment SubCommand - Cancel an active payment
 * Usage: !webpos cancelPayment <payment-id>
 */
import type WebPosModule from "../index";
export declare class CancelPaymentSubCommand {
    #private;
    readonly name = "cancelPayment";
    readonly aliases: readonly string[];
    readonly description = "\u00D6demeyi iptal et";
    readonly usage = "!webpos cancelPayment <payment-id>";
    constructor(module: WebPosModule);
    execute(sender: any, args: readonly string[]): Promise<boolean>;
    tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]>;
}
