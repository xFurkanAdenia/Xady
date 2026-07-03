import BaseModule from "../models/BaseModule";
/**
 * Service Priority - Hangi servis sağlayıcısının öncelikli olduğunu belirler
 */
export declare enum ServicePriority {
    LOWEST = 5,
    LOW = 4,
    NORMAL = 3,
    HIGH = 2,
    HIGHEST = 1
}
/**
 * ServiceManager - Modüller arası servis paylaşımı
 *
 * Minecraft Bukkit/Spigot'taki ServicesManager'a benzer şekilde çalışır.
 * Modüller servis sağlayabilir ve diğer modüller bu servisleri kullanabilir.
 *
 * @example
 * // Servis sağla
 * serviceManager.register(EconomyService, new MyEconomyImpl(), this, ServicePriority.NORMAL);
 *
 * // Servis kullan
 * const economy = serviceManager.getService(EconomyService);
 * if (economy) {
 *     economy.addMoney(player, 100);
 * }
 */
export declare class ServiceManager {
    private services;
    private moduleServices;
    /**
     * Bir servisi register eder
     *
     * @param serviceClass Servis interface/class'ı
     * @param service Servis implementasyonu
     * @param provider Servisi sağlayan modül
     * @param priority Servis önceliği (varsayılan: NORMAL)
     */
    register<T>(serviceClass: new (...args: any[]) => T, service: T, provider: BaseModule, priority?: ServicePriority): void;
    /**
     * Bir servisi unregister eder
     *
     * @param serviceClass Servis class'ı
     * @param provider Servisi sağlayan modül
     */
    unregister<T>(serviceClass: new (...args: any[]) => T, provider: BaseModule): void;
    /**
     * Bir modülün tüm servislerini unregister eder
     *
     * @param provider Modül
     */
    unregisterAll(provider: BaseModule): void;
    /**
     * En yüksek öncelikli servisi döndürür
     *
     * @param serviceClass Servis class'ı
     * @returns Servis veya undefined
     */
    getService<T>(serviceClass: new (...args: any[]) => T): T | undefined;
    /**
     * Belirli bir önceliğe sahip servisi döndürür
     *
     * @param serviceClass Servis class'ı
     * @param priority Öncelik
     * @returns Servis veya undefined
     */
    getServiceByPriority<T>(serviceClass: new (...args: any[]) => T, priority: ServicePriority): T | undefined;
    /**
     * Tüm servisleri döndürür (öncelik sırasına göre)
     *
     * @param serviceClass Servis class'ı
     * @returns Servis listesi
     */
    getServices<T>(serviceClass: new (...args: any[]) => T): T[];
    /**
     * Servis kayıtlı mı kontrol eder
     *
     * @param serviceClass Servis class'ı
     * @returns Kayıtlı mı
     */
    isServiceRegistered<T>(serviceClass: new (...args: any[]) => T): boolean;
    /**
     * Belirli bir modülün servisi sağlayıp sağlamadığını kontrol eder
     *
     * @param serviceClass Servis class'ı
     * @param provider Modül
     * @returns Sağlıyor mu
     */
    isProvidedBy<T>(serviceClass: new (...args: any[]) => T, provider: BaseModule): boolean;
    /**
     * Bir servisin sağlayıcısını döndürür
     *
     * @param serviceClass Servis class'ı
     * @returns Sağlayıcı modül veya undefined
     */
    getProvider<T>(serviceClass: new (...args: any[]) => T): BaseModule | undefined;
    /**
     * Tüm kayıtlı servisleri listeler
     */
    listServices(): void;
}
