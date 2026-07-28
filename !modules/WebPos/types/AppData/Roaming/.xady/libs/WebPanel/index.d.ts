import "../typings/xady";
import { WebPanelApi } from "./types";
export * from "./types";
export * from "./assets";
export * from "./auth";
export * from "./http";
export * from "./users";
export * from "./webServer";
export default class WebPanelModule extends Xady.Module {
    static getInstance(): WebPanelModule;
    webApi?: WebPanelApi;
    onEnable(): void;
    onDisable(): void;
}
