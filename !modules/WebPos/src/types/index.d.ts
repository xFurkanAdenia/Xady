import type PosManager from "../manager/PosManager";
import type PosFunctionRegistry from "../manager/PosFunctionRegistry";
import type PosStorage from "../storage/PosStorage";

declare module "WebPos" {
    export default class WebPosModule extends Xady.Module {
        getPosManager(): PosManager;
        getFunctionRegistry(): PosFunctionRegistry;
        getFileConfig(): Record<string, any>;
        updateAndReloadConfig(incoming: any): void;
        static getInstance(): WebPosModule;
    }
}
