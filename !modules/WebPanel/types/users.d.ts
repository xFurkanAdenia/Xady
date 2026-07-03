import { Pool } from "mysql2/promise";
export declare function getDbPool(): Pool | undefined;
export type UserRecord = {
    username: string;
    passwordHash: string;
    roles: string[];
    bannedUntil?: number | null;
    banReason?: string | null;
    customPermissions?: string[];
};
export declare class UserStore {
    #private;
    init(): Promise<void>;
    close(): Promise<void>;
    private getDbConfig;
    private ready;
    getUser(username: string): Promise<UserRecord | null>;
    listUsers(): Promise<Array<{
        username: string;
        roles: string[];
        bannedUntil?: number | null;
        banReason?: string | null;
        customPermissions?: string[];
    }>>;
    createUser(username: string, password: string, roles: string[]): Promise<void>;
    deleteUser(username: string): Promise<void>;
    updateUser(username: string, patch: {
        password?: string | null;
        roles?: string[] | null;
        bannedUntil?: number | null;
        banReason?: string | null;
        customPermissions?: string[] | null;
    }): Promise<void>;
}
