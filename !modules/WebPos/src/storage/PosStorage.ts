// PosStorage - JSON bazlı persistent storage

import fs from "fs";
import path from "path";
import PosUser, { PosUserData } from "../models/PosUser";
import { PosPaymentData } from "../models/PosPayment";

export interface PosStorageData {
    users: Record<string, PosUserData>;
    payments: PosPaymentData[]; // Tamamlanan ödemeler
    version: string;
}

export default class PosStorage {
    #filePath: string;
    #data: PosStorageData;

    constructor(filePath: string) {
        this.#filePath = filePath;
        this.#data = this.#load();
    }

    // ── Users ──────────────────────────────────────────────────────────────

    getUser(username: string): PosUser | null {
        const userData = this.#data.users[username];
        if (!userData) return null;
        return new PosUser(userData);
    }

    createUser(username: string): PosUser {
        const userData: PosUserData = {
            username,
            balance: 0,
            products: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.#data.users[username] = userData;
        this.#save();
        return new PosUser(userData);
    }

    saveUser(user: PosUser) {
        this.#data.users[user.getUsername()] = user.toJSON();
        this.#save();
    }

    getAllUsers(): PosUser[] {
        return Object.values(this.#data.users).map(data => new PosUser(data));
    }

    // ── Payments ──────────────────────────────────────────────────────────

    savePayment(payment: PosPaymentData) {
        // Önce var mı kontrol et
        const index = this.#data.payments.findIndex(p => p.id === payment.id);
        if (index !== -1) {
            this.#data.payments[index] = payment;
        } else {
            this.#data.payments.unshift(payment);
        }

        // Son 500 ödemeyi tut
        if (this.#data.payments.length > 500) {
            this.#data.payments = this.#data.payments.slice(0, 500);
        }

        this.#save();
    }

    getPayments(limit: number = 100): PosPaymentData[] {
        return this.#data.payments.slice(0, limit);
    }

    getPaymentById(id: string): PosPaymentData | null {
        return this.#data.payments.find(p => p.id === id) || null;
    }

    // ── Storage ────────────────────────────────────────────────────────────

    #load(): PosStorageData {
        try {
            if (fs.existsSync(this.#filePath)) {
                const raw = fs.readFileSync(this.#filePath, "utf8");
                return JSON.parse(raw);
            }
        } catch (error) {
            console.error("[PosStorage] Load error:", error);
        }

        return {
            users: {},
            payments: [],
            version: "1.0.0",
        };
    }

    #save() {
        try {
            const dir = path.dirname(this.#filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.#filePath, JSON.stringify(this.#data, null, 2), "utf8");
        } catch (error) {
            console.error("[PosStorage] Save error:", error);
        }
    }

    destroy() {
        // Son kez kaydet
        this.#save();
    }
}
