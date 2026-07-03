export type WebPanelApi = {
    registerNav: (item: {
        id: string;
        title: string;
        path: string;
        permission?: string;
        scope?: "app" | "admin";
    }) => void;
    unregisterNav: (id: string) => void;
    registerView: (path: string, handler: (req: any, ctx: any) => Promise<string> | string) => void;
    unregisterView: (path: string) => void;
    registerPermission: (perm: {
        id: string;
        description: string;
        defaultRole?: string;
    }) => void;
    unregisterPermission: (id: string) => void;
    registerHttp: (handler: (req: any, res: any, ctx?: {
        session: {
            username: string;
            roles: string[];
            permissions: string[];
        } | null;
        hasPerm: (perm: string) => boolean;
    }) => boolean | Promise<boolean>) => void;
    unregisterHttp: (handler: (req: any, res: any) => any) => void;
    pushChat: (text: string) => void;
};
