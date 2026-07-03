import "../typings/xady";
import { WebPanelApi } from "./types";
export default class WebPanelModule extends Xady.Module {
    #private;
    webApi?: WebPanelApi;
    onEnable(): void;
    private registerBuiltinViews;
    onDisable(): void;
    static getInstance(): WebPanelModule;
}
