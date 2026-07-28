import PosFunction, { PosFunctionData } from "../models/PosFunction";
export default class PosFunctionRegistry {
    #private;
    /**
     * Yeni fonksiyon kaydet
     */
    register(data: PosFunctionData): boolean;
    /**
     * Fonksiyon kaydını sil
     */
    unregister(functionId: string): boolean;
    /**
     * Modüle ait tüm fonksiyonları sil
     */
    unregisterModule(moduleName: string): number;
    /**
     * Fonksiyon getir
     */
    getFunction(functionId: string): PosFunction | undefined;
    /**
     * Tüm fonksiyonları getir
     */
    getAllFunctions(): PosFunction[];
    /**
     * Kullanıcının izni olan fonksiyonları getir
     */
    getFunctionsForUser(userPermissions: string[]): PosFunction[];
    /**
     * Serialize edilebilir format (API için)
     */
    toJSON(): Omit<PosFunctionData, "handler">[];
    clear(): void;
}
