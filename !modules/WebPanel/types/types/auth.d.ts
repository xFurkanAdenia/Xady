export type Session = {
    username: string;
    roles: string[];
    customPermissions: string[];
    createdAt: number;
    csrfToken: string;
    isApiKey?: boolean;
};
export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, stored: string): boolean;
export declare class SessionStore {
    create(username: string, roles: string[], customPermissions?: string[]): Promise<{
        token: string;
        csrfToken: string;
    }>;
    updateUserSessions(username: string, updates: {
        roles?: string[];
        customPermissions?: string[];
    }): Promise<void>;
    kickUser(username: string): Promise<void>;
    get(token: string | undefined): Promise<Session | null>;
    delete(token: string | undefined): Promise<void>;
    clear(): Promise<void>;
}
export declare function sessionCookie(token: string): string;
export declare function clearSessionCookie(): string;
