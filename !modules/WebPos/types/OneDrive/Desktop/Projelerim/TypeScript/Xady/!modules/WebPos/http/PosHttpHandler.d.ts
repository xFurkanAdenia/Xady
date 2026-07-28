import type { IncomingMessage, ServerResponse } from "node:http";
type HttpHandler = (req: IncomingMessage, res: ServerResponse, ctx?: any) => boolean | Promise<boolean>;
/**
 * WebPos HTTP API Handler + SSE push sistemi
 */
export default class PosHttpHandler {
    #private;
    getHandler(): HttpHandler;
    /**
     * SSE ile tüm bağlı istemcilere bir olay yayınlar
     */
    push(event: string, data: any): void;
    destroySse(): void;
}
export {};
