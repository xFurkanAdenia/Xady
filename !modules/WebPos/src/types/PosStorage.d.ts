import type PosUser from "../models/PosUser";

export default class PosStorage {
    getUser(username: string): PosUser | null;
    createUser(username: string): PosUser;
    saveUser(user: PosUser): void;
    getAllUsers(): PosUser[];
}
