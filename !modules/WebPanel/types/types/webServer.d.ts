import type { IncomingMessage, ServerResponse } from "node:http";
type NavItem = {
    id: string;
    title: string;
    path: string;
    permission?: string;
    scope?: "app" | "admin";
};
type ViewHandler = (req: IncomingMessage, ctx: HttpHandlerCtx) => Promise<string> | string;
type PermissionDef = {
    id: string;
    description: string;
    defaultRole?: string;
};
type HttpHandlerCtx = {
    session: {
        username: string;
        roles: string[];
        permissions: string[];
    } | null;
    hasPerm: (perm: string) => boolean;
};
type HttpHandler = (req: IncomingMessage, res: ServerResponse, ctx?: HttpHandlerCtx) => boolean | Promise<boolean>;
type ChatEntry = {
    at: number;
    text: string;
    source: "server" | "bot" | "web";
};
export declare class WebPanelServer {
    #private;
    constructor(opts: {
        client: any;
        nav: Map<string, NavItem>;
        views: Map<string, ViewHandler>;
        permissions: Map<string, PermissionDef>;
        httpHandlers: Set<HttpHandler>;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    pushChat(entry: ChatEntry): void;
    private getRolePermissions;
    private hasPermission;
    private getSession;
    handle(req: IncomingMessage, res: ServerResponse): Promise<void>;
}
export {};
