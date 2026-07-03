import DemoServiceAPI from "./DemoServiceAPI";

/**
 * Demo Service Implementation - Örnek servis implementasyonu
 */
export default class DemoServiceImpl extends DemoServiceAPI {
    private processedCount: number = 0;
    private errorCount: number = 0;
    private startTime: number = Date.now();

    async processData(data: string): Promise<string> {
        try {
            // Veriyi işle (örnek)
            const processed = `[${new Date().toISOString()}] Processed: ${data.toUpperCase()}`;
            this.processedCount++;
            
            console.log(`🔧 [DemoService] Data processed: ${data} -> ${processed}`);
            return processed;
        } catch (error) {
            this.errorCount++;
            console.error(`❌ [DemoService] Processing error:`, error);
            throw error;
        }
    }

    async getStats(): Promise<{processed: number, errors: number}> {
        const uptime = Date.now() - this.startTime;
        console.log(`📊 [DemoService] Stats - Processed: ${this.processedCount}, Errors: ${this.errorCount}, Uptime: ${uptime}ms`);
        
        return {
            processed: this.processedCount,
            errors: this.errorCount
        };
    }

    async reset(): Promise<void> {
        console.log(`🔄 [DemoService] Resetting stats...`);
        this.processedCount = 0;
        this.errorCount = 0;
        this.startTime = Date.now();
    }

    async isHealthy(): Promise<boolean> {
        // Basit health check
        const errorRate = this.processedCount > 0 ? this.errorCount / this.processedCount : 0;
        const healthy = errorRate < 0.1; // %10'dan az hata oranı
        
        console.log(`💚 [DemoService] Health check - Healthy: ${healthy}, Error rate: ${(errorRate * 100).toFixed(1)}%`);
        return healthy;
    }
}