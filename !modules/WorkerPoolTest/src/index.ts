export default class WorkerPoolTestModule extends Xady.Module {
    onEnable(): void {
        console.log("[WorkerPoolTest] Modül yüklendi!");

        // Test komutu kaydet
        const testCmd = new Xady.PluginCommand("wptest", this)
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    const pool = Xady.WorkerPool.getInstance();
                    
                    // WorkerPool durumunu göster
                    const isEnabled = (pool as any).isEnabled;
                    const maxWorkers = (pool as any).maxWorkers;
                    const workersCount = (pool as any).workers?.length || 0;
                    
                    sender.sendMessage("§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    sender.sendMessage("§6§l WorkerPool Durum Raporu");
                    sender.sendMessage("§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    sender.sendMessage(`§7Durum: ${isEnabled ? '§a✓ Aktif' : '§c✗ Kapalı'}`);
                    sender.sendMessage(`§7Max Workers: §f${maxWorkers}`);
                    sender.sendMessage(`§7Çalışan Thread: §f${workersCount}`);
                    sender.sendMessage(`§7Mod: ${isEnabled ? '§bWorker Thread' : '§eMain Thread'}`);
                    sender.sendMessage("§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    
                    if (!isEnabled) {
                        sender.sendMessage("§c⚠ WorkerPool kapalı! Tüm işlemler main thread'de çalışacak.");
                        sender.sendMessage("§7Açmak için: Settings > Performance > enabled = true");
                    }
                    
                    sender.sendMessage("§e🔄 Performans testi başlatılıyor...");

                    try {
                        // Test 1: CPU-yoğun işlem (main thread'i bloke eder)
                        sender.sendMessage("§7Test: Fibonacci(35) hesaplama...");
                        const start = Date.now();
                        const result = await pool.execute(
                            (n: number) => {
                                function fib(x: number): number {
                                    if (x <= 1) return x;
                                    return fib(x - 1) + fib(x - 2);
                                }
                                return fib(n);
                            },
                            [35],
                            Xady.TaskPriority.HIGH
                        );
                        const duration = Date.now() - start;
                        sender.sendMessage(`§a✅ Fibonacci(35) = ${result}`);
                        sender.sendMessage(`§6⏱ Süre: ${duration}ms`);
                        
                        // Test 2: Paralel işlemler
                        sender.sendMessage("§7Test: 4 paralel ağır işlem...");
                        const start2 = Date.now();
                        const promises = [];
                        for (let i = 0; i < 4; i++) {
                            promises.push(
                                pool.execute(
                                    (x: number) => {
                                        // Ağır hesaplama
                                        let sum = 0;
                                        for (let j = 0; j < 50000000; j++) {
                                            sum += Math.sqrt(j);
                                        }
                                        return sum;
                                    },
                                    [i],
                                    Xady.TaskPriority.NORMAL
                                )
                            );
                        }
                        await Promise.all(promises);
                        const duration2 = Date.now() - start2;
                        sender.sendMessage(`§a✅ 4 paralel işlem tamamlandı`);
                        sender.sendMessage(`§6⏱ Süre: ${duration2}ms`);
                        
                        sender.sendMessage("§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        sender.sendMessage("§a§l Test Tamamlandı!");
                        sender.sendMessage("§e━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                        
                        if (isEnabled) {
                            sender.sendMessage("§7Worker thread'ler paralel çalıştı.");
                            sender.sendMessage("§7Main thread bloke olmadı!");
                        } else {
                            sender.sendMessage("§cMain thread bloke oldu!");
                            sender.sendMessage("§7Bot donmuş gibi görünüyordu değil mi?");
                        }
                        
                    } catch (e: any) {
                        sender.sendMessage(`§c❌ Hata: ${e.message}`);
                        console.error("[WorkerPoolTest] Hata:", e);
                    }

                    return true;
                }
            });

        this.getClient().getCommandManager().registerCommand(testCmd);
        console.log("[WorkerPoolTest] !wptest komutu kaydedildi");
    }

    onDisable(): void {
        console.log("[WorkerPoolTest] Modül devre dışı bırakıldı");
    }
}
