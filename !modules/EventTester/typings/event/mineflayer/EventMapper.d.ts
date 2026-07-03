import { XadyEvent } from '../XadyEvent';
type EventConstructor = new (...args: any[]) => XadyEvent;
interface EventMapping {
    EventClass: EventConstructor;
    argsMapper: (...args: any[]) => any[];
}
export declare const EVENT_MAP: Record<string, EventMapping>;
export {};
