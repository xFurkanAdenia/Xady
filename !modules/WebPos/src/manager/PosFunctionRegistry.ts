// PosFunctionRegistry - Modüllerin fonksiyon kaydetmesi için

import PosFunction, { PosFunctionData } from "../models/PosFunction";

export default class PosFunctionRegistry {
    #functions: Map<string, PosFunction> = new Map();

    /**
     * Yeni fonksiyon kaydet
     */
    register(data: PosFunctionData): boolean {
        if (this.#functions.has(data.id)) {
            console.warn(`[PosFunctionRegistry] Fonksiyon zaten kayıtlı: ${data.id}`);
            return false;
        }

        const fn = new PosFunction(data);
        this.#functions.set(data.id, fn);
        console.log(`[PosFunctionRegistry] Fonksiyon kaydedildi: ${data.id} (${data.module})`);
        return true;
    }

    /**
     * Fonksiyon kaydını sil
     */
    unregister(functionId: string): boolean {
        const deleted = this.#functions.delete(functionId);
        if (deleted) {
            console.log(`[PosFunctionRegistry] Fonksiyon silindi: ${functionId}`);
        }
        return deleted;
    }

    /**
     * Modüle ait tüm fonksiyonları sil
     */
    unregisterModule(moduleName: string): number {
        let count = 0;
        for (const [id, fn] of this.#functions.entries()) {
            if (fn.getModule() === moduleName) {
                this.#functions.delete(id);
                count++;
            }
        }
        if (count > 0) {
            console.log(`[PosFunctionRegistry] ${moduleName} modülünün ${count} fonksiyonu silindi`);
        }
        return count;
    }

    /**
     * Fonksiyon getir
     */
    getFunction(functionId: string): PosFunction | undefined {
        return this.#functions.get(functionId);
    }

    /**
     * Tüm fonksiyonları getir
     */
    getAllFunctions(): PosFunction[] {
        return Array.from(this.#functions.values());
    }

    /**
     * Kullanıcının izni olan fonksiyonları getir
     */
    getFunctionsForUser(userPermissions: string[]): PosFunction[] {
        return this.getAllFunctions().filter(fn => {
            const requiredPerms = fn.getPermissions();
            if (requiredPerms.length === 0) return true; // İzin gerekmiyorsa göster

            // Kullanıcının tüm gerekli izinleri var mı?
            return requiredPerms.every(perm => userPermissions.includes(perm));
        });
    }

    /**
     * Serialize edilebilir format (API için)
     */
    toJSON() {
        const functions = this.getAllFunctions().map(fn => fn.toJSON());
        return functions;
    }

    clear() {
        this.#functions.clear();
    }
}
