import "reflect-metadata";
import { EventPriority } from "./EventPriority";

export const EVENT_HANDLER_METADATA_KEY = Symbol("EVENT_HANDLER_METADATA_KEY");

export interface EventHandlerOptions {
    priority: EventPriority;
}

export function EventHandler(priority: EventPriority = EventPriority.NORMAL): any {
    return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        // Parametre tiplerini almak için reflect-metadata kullanıyoruz.
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        
        if (!paramTypes || paramTypes.length !== 1) {
            throw new Error(`@EventHandler requires exactly one parameter (the event) on ${String(propertyKey)}`);
        }

        const eventClass = paramTypes[0];

        if (eventClass === Object) {
            console.error(`\n[XADY Event API] UYARI: '${String(propertyKey)}' metodundaki event parametresinin tipi TypeScript tarafından 'Object' olarak algılandı!\nLütfen event tipini 'import' ile .d.ts dosyasından almak yerine, 'ev: Xady.EventName' şeklinde belirleyin (örneğin: 'ev: Xady.LoginEvent'). Aksi takdirde EventBus bu metodu tetikleyemez!\n`);
        }

        const handlers = Reflect.getMetadata(EVENT_HANDLER_METADATA_KEY, target.constructor) || [];
        handlers.push({
            methodName: propertyKey,
            eventClass: eventClass,
            priority: priority
        });

        Reflect.defineMetadata(EVENT_HANDLER_METADATA_KEY, handlers, target.constructor);
    };
}
