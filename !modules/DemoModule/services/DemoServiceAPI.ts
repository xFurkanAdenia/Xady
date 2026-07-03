/**
 * Demo Service API - Örnek servis interface'i
 */
export default abstract class DemoServiceAPI {
    /**
     * Veriyi işler
     */
    abstract processData(data: string): Promise<string>;

    /**
     * Statistikleri alır
     */
    abstract getStats(): Promise<{processed: number, errors: number}>;

    /**
     * Servisi sıfırlar
     */
    abstract reset(): Promise<void>;

    /**
     * Servis durumunu döndürür
     */
    abstract isHealthy(): Promise<boolean>;
}