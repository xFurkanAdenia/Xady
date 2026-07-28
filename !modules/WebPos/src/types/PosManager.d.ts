import type PosStorage from "../storage/PosStorage";

export type PosConfig = {
    pattern: string;
    usernameIndex: number;
    amountIndex: number;
    decimalSeparator: "comma_decimal" | "dot_decimal";
    payCommand: string;
    paymentTimeoutMinutes: number;
    messages: {
        success: string;
        success_exact: string;
        insufficient: string;
        no_payment: string;
        refund: string;
    };
};

export default class PosManager {
    getStorage(): PosStorage;
    getConfig(): PosConfig;
    updateConfig(config: PosConfig): void;
}
