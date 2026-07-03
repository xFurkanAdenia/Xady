import type { IncomingMessage, ServerResponse } from "node:http";
export declare function sendBuffer(res: ServerResponse, status: number, body: Buffer, contentType: string, headers?: Record<string, string>): void;
export declare function json(res: ServerResponse, status: number, body: unknown, headers?: Record<string, string>): void;
export declare function text(res: ServerResponse, status: number, body: string, headers?: Record<string, string>): void;
export declare function html(res: ServerResponse, status: number, body: string, headers?: Record<string, string>): void;
export declare function redirect(res: ServerResponse, location: string): void;
export declare function readBody(req: IncomingMessage, maxBytes: number): Promise<Buffer<ArrayBufferLike>>;
export declare function parseCookies(cookieHeader: string | undefined): Record<string, string>;
