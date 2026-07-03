import { Listener } from "./Listener";
import { XadyEvent } from "./XadyEvent";
import BaseModule from "../models/BaseModule";
export declare class EventManager {
    private handlers;
    private moduleListeners;
    registerEvents(listener: Listener, module: BaseModule): void;
    unregisterAll(module: BaseModule): void;
    callEvent(event: XadyEvent): XadyEvent;
}
