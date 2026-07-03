import BaseModule from "../models/BaseModule";
import chalk from "chalk";
import { activeModuleStorage } from "../context";

/**
 * Service Priority - Hangi servis sağlayıcısının öncelikli olduğunu belirler
 */
export enum ServicePriority {
    LOWEST = 5,
    LOW = 4,
    NORMAL = 3,
    HIGH = 2,
    HIGHEST = 1
}

/**
 * Registered Service - Kayıtlı servis bilgisi
 */
interface RegisteredService<T> {
    service: T;
    provider: BaseModule;
    priority: ServicePriority;
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
export class ServiceManager {
    // ServiceClass -> RegisteredService[]
    private services: Map<unknown, RegisteredService<unknown>[]> = new Map();
    
    // ModuleName -> ServiceClass[]
    private moduleServices: Map<string, (new (...args: unknown[]) => unknown)[]> = new Map();

    /**
     * Bir servisi register eder
     * 
     * @param serviceClass Servis interface/class'ı
     * @param service Servis implementasyonu
     * @param provider Servisi sağlayan modül
     * @param priority Servis önceliği (varsayılan: NORMAL)
     */
    register<T>(
        serviceClass: new (...args: unknown[]) => T,
        service: T,
        provider: BaseModule,
        priority: ServicePriority = ServicePriority.NORMAL
    ): void {
        const moduleName = provider.getModuleManifest().getName();
        
        // Fake provider guard: aktif modül bağlamını kontrol et
        const activeModule = activeModuleStorage.getStore();
        if (activeModule && activeModule !== moduleName) {
            throw new Error(`Güvenlik Engeli: "${activeModule}" modülü, "${moduleName}" modülü adına servis kaydetmeye çalıştı!`);
        }
        
        // Servis listesini al veya oluştur
        if (!this.services.has(serviceClass)) {
            this.services.set(serviceClass, []);
        }
        
        const serviceList = this.services.get(serviceClass)!;
        
        // Servisi ekle
        serviceList.push({
            service,
            provider,
            priority
        });
        
        // Önceliğe göre sırala (HIGHEST önce gelir)
        serviceList.sort((a, b) => a.priority - b.priority);
        
        // Modül servislerini takip et
        if (!this.moduleServices.has(moduleName)) {
            this.moduleServices.set(moduleName, []);
        }
        this.moduleServices.get(moduleName)!.push(serviceClass as new (...args: unknown[]) => unknown);
        
        console.log(chalk.green(`[ServiceManager] ${moduleName} -> ${serviceClass.name} (Priority: ${ServicePriority[priority]})`));
    }

    /**
     * Bir servisi unregister eder
     * 
     * @param serviceClass Servis class'ı
     * @param provider Servisi sağlayan modül
     */
    unregister<T>(serviceClass: new (...args: unknown[]) => T, provider: BaseModule): void {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList) return;
        
        const moduleName = provider.getModuleManifest().getName();
        
        // Modülün servisini kaldır
        const filtered = serviceList.filter(s => s.provider !== provider);
        
        if (filtered.length === 0) {
            this.services.delete(serviceClass);
        } else {
            this.services.set(serviceClass, filtered);
        }
        
        console.log(chalk.yellow(`[ServiceManager] ${moduleName} unregistered ${serviceClass.name}`));
    }

    /**
     * Bir modülün tüm servislerini unregister eder
     * 
     * @param provider Modül
     */
    unregisterAll(provider: BaseModule): void {
        const moduleName = provider.getModuleManifest().getName();
        const serviceClasses = this.moduleServices.get(moduleName);
        
        if (!serviceClasses) return;
        
        for (const serviceClass of serviceClasses) {
            this.unregister(serviceClass, provider);
        }
        
        this.moduleServices.delete(moduleName);
    }

    /**
     * En yüksek öncelikli servisi döndürür
     * 
     * @param serviceClass Servis class'ı
     * @returns Servis veya undefined
     */
    getService<T>(serviceClass: new (...args: unknown[]) => T): T | undefined {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList || serviceList.length === 0) return undefined;
        
        // En yüksek öncelikli (ilk) servisi döndür
        return serviceList[0].service as T;
    }

    /**
     * Belirli bir önceliğe sahip servisi döndürür
     * 
     * @param serviceClass Servis class'ı
     * @param priority Öncelik
     * @returns Servis veya undefined
     */
    getServiceByPriority<T>(
        serviceClass: new (...args: unknown[]) => T,
        priority: ServicePriority
    ): T | undefined {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList) return undefined;
        
        const found = serviceList.find(s => s.priority === priority);
        return found?.service as T | undefined;
    }

    /**
     * Tüm servisleri döndürür (öncelik sırasına göre)
     * 
     * @param serviceClass Servis class'ı
     * @returns Servis listesi
     */
    getServices<T>(serviceClass: new (...args: unknown[]) => T): T[] {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList) return [];
        
        return serviceList.map(s => s.service as T);
    }

    /**
     * Servis kayıtlı mı kontrol eder
     * 
     * @param serviceClass Servis class'ı
     * @returns Kayıtlı mı
     */
    isServiceRegistered<T>(serviceClass: new (...args: unknown[]) => T): boolean {
        const serviceList = this.services.get(serviceClass);
        return serviceList !== undefined && serviceList.length > 0;
    }

    /**
     * Belirli bir modülün servisi sağlayıp sağlamadığını kontrol eder
     * 
     * @param serviceClass Servis class'ı
     * @param provider Modül
     * @returns Sağlıyor mu
     */
    isProvidedBy<T>(serviceClass: new (...args: unknown[]) => T, provider: BaseModule): boolean {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList) return false;
        
        return serviceList.some(s => s.provider === provider);
    }

    /**
     * Bir servisin sağlayıcısını döndürür
     * 
     * @param serviceClass Servis class'ı
     * @returns Sağlayıcı modül veya undefined
     */
    getProvider<T>(serviceClass: new (...args: unknown[]) => T): BaseModule | undefined {
        const serviceList = this.services.get(serviceClass);
        if (!serviceList || serviceList.length === 0) return undefined;
        
        return serviceList[0].provider;
    }

    /**
     * Tüm kayıtlı servisleri listeler
     */
    listServices(): void {
        console.log(chalk.cyan("\n=== Registered Services ==="));
        
        if (this.services.size === 0) {
            console.log(chalk.gray("No services registered."));
            return;
        }
        
        for (const [serviceClass, serviceList] of this.services.entries()) {
            console.log(chalk.yellow(`\n${(serviceClass as Function).name}:`));
            for (const { provider, priority } of serviceList) {
                const moduleName = provider.getModuleManifest().getName();
                console.log(chalk.gray(`  - ${moduleName} (${ServicePriority[priority]})`));
            }
        }
        
        console.log();
    }
}
