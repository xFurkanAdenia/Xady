import PosManager from "./manager/PosManager";
export default class WebPosModule extends Xady.Module {
    #private;
    onEnable(): void;
    onDisable(): void;
    getPosManager(): PosManager;
    /**
     * Dosya config ham verisini dön (WebPanel config sayfası için)
     */
    getFileConfig(): Record<string, any>;
    /**
     * WebPanel config sayfasından gelen güncellenmiş config objesini kaydeder ve yeniden yükler.
     */
    updateAndReloadConfig(incoming: any): void;
    static getInstance(): WebPosModule;
}
