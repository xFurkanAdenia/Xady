import os from "os";
import path from "path";
import fs from "fs";

/**
 * Xady AppData yöneticisi
 * 
 * Windows: C:\Users\{user}\AppData\Roaming\Xady
 * Linux: ~/.config/Xady
 * macOS: ~/Library/Application Support/Xady
 */
export class AppDataManager {
    private static instance: AppDataManager;
    private readonly appDataPath: string;
    
    private constructor() {
        // Platform-agnostic AppData path
        const platform = os.platform();
        
        if (platform === "win32") {
            this.appDataPath = path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), "Xady");
        } else if (platform === "darwin") {
            this.appDataPath = path.join(os.homedir(), "Library", "Application Support", "Xady");
        } else {
            // Linux ve diğerleri
            this.appDataPath = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "Xady");
        }
        
        // AppData klasörlerini oluştur
        this.ensureDirectories();
    }
    
    static getInstance(): AppDataManager {
        if (!AppDataManager.instance) {
            AppDataManager.instance = new AppDataManager();
        }
        return AppDataManager.instance;
    }
    
    /**
     * AppData root path
     * Örnek: C:\Users\ev.pc\AppData\Roaming\Xady
     */
    getAppDataPath(): string {
        return this.appDataPath;
    }
    
    /**
     * Modüller klasörü
     * Örnek: C:\Users\ev.pc\AppData\Roaming\Xady\modules
     */
    getModulesPath(): string {
        return path.join(this.appDataPath, "modules");
    }
    
    /**
     * Config klasörü
     * Örnek: C:\Users\ev.pc\AppData\Roaming\Xady\config
     */
    getConfigPath(): string {
        return path.join(this.appDataPath, "config");
    }
    
    /**
     * Modül data klasörleri
     * Örnek: C:\Users\ev.pc\AppData\Roaming\Xady\data
     */
    getDataPath(): string {
        return path.join(this.appDataPath, "data");
    }
    
    /**
     * Config dosyası path'i
     */
    getConfigFilePath(): string {
        return path.join(this.getConfigPath(), "xady.config.json");
    }
    
    /**
     * Gerekli klasörleri oluştur
     */
    private ensureDirectories(): void {
        const dirs = [
            this.appDataPath,
            this.getModulesPath(),
            this.getConfigPath(),
            this.getDataPath()
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[AppData] Klasör oluşturuldu: ${dir}`);
            }
        }
    }
    
    /**
     * Development modunda mı kontrol et
     * Development: Modüller src/modules'te
     * Production: Modüller AppData'da
     */
    isDevMode(): boolean {
        // pkg ile paketlenmişse production
        return !(process as any).pkg;
    }
    
    /**
     * Modül yolunu al (dev veya prod)
     */
    getModulesDirectory(): string {
        if (this.isDevMode()) {
            // Development: proje klasöründeki modules
            return path.join(process.cwd(), "dist", "modules");
        } else {
            // Production: AppData'daki modules
            return this.getModulesPath();
        }
    }
    
    /**
     * Config dosya yolunu al (dev veya prod)
     */
    getConfigFile(): string {
        if (this.isDevMode()) {
            // Development: proje klasöründeki config
            return path.join(process.cwd(), "xady.config.json");
        } else {
            // Production: AppData'daki config
            return this.getConfigFilePath();
        }
    }
    
    /**
     * İlk kurulum için varsayılan modülleri kopyala
     * NOT: Sadece .first-run dosyası yoksa çalışır
     */
    copyDefaultModules(sourceDir: string): void {
        const firstRunFlag = path.join(this.appDataPath, ".first-run");
        
        // İlk kurulum kontrolü
        if (fs.existsSync(firstRunFlag)) {
            // Daha önce kurulum yapılmış, skip
            return;
        }
        
        const targetDir = this.getModulesPath();
        
        if (!fs.existsSync(sourceDir)) {
            console.warn(`[AppData] Kaynak modül klasörü bulunamadı: ${sourceDir}`);
            return;
        }
        
        const files = fs.readdirSync(sourceDir);
        let copiedCount = 0;
        
        for (const file of files) {
            if (file.endsWith(".xext") || file.endsWith(".xar")) {
                const sourcePath = path.join(sourceDir, file);
                const targetPath = path.join(targetDir, file);
                
                // Hedefte yoksa kopyala
                if (!fs.existsSync(targetPath)) {
                    fs.copyFileSync(sourcePath, targetPath);
                    copiedCount++;
                    console.log(`[AppData] Modül kopyalandı: ${file}`);
                }
            }
        }
        
        if (copiedCount > 0) {
            console.log(`[AppData] ${copiedCount} modül AppData'ya kopyalandı.`);
        }
        
        // İlk kurulum tamamlandı, flag oluştur
        fs.writeFileSync(firstRunFlag, new Date().toISOString());
        console.log(`[AppData] İlk kurulum tamamlandı.`);
    }
}

// Singleton export
export default AppDataManager.getInstance();
