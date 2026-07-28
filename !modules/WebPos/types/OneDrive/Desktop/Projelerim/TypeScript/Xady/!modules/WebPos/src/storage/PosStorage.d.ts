import PosUser, { PosUserData } from "../models/PosUser";
import { PosPaymentData } from "../models/PosPayment";
export interface PosStorageData {
    users: Record<string, PosUserData>;
    payments: PosPaymentData[];
    version: string;
}
export default class PosStorage {
    #private;
    constructor(filePath: string);
    getUser(username: string): PosUser | null;
    createUser(username: string): PosUser;
    saveUser(user: PosUser): void;
    getAllUsers(): PosUser[];
    savePayment(payment: PosPaymentData): void;
    getPayments(limit?: number): PosPaymentData[];
    getPaymentById(id: string): PosPaymentData | null;
    destroy(): void;
}
