export type Client = any;
export type ClientOptions = any;
export type Vec3 = any;
export type Item = any;
export class Window<T = any> {}
export type Recipe = any;
export type Block = any;
export type Entity = any;
export type ChatMessage = any;
export namespace world {
  export type world = any;
  export type WorldSync = any;
}
export type Registry = any;
export type IndexedData = any;

export type EventEmitter = any;
export default interface TypedEmitter<Events extends Record<string | symbol, any>> extends EventEmitter {
    on<E extends keyof Events>(event: E, listener: Events[E]): this;
    once<E extends keyof Events>(event: E, listener: Events[E]): this;
    emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E] extends (...args: any[]) => any ? Events[E] : never>): boolean;
    removeAllListeners<E extends keyof Events>(event?: E): this;
}
