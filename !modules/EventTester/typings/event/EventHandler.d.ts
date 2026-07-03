import "reflect-metadata";
import { EventPriority } from "./EventPriority";
export declare const EVENT_HANDLER_METADATA_KEY: unique symbol;
export interface EventHandlerOptions {
    priority: EventPriority;
}
export declare function EventHandler(priority?: EventPriority): MethodDecorator;
