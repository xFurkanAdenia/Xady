// WorkerPool test scripti
const { WorkerPool, TaskPriority } = require('./dist/classes/WorkerPool');

async function testWorkerPool() {
    const pool = WorkerPool.getInstance();
    
    console.log('\n=== WORKERPOOL TEST ===\n');
    
    // Test 1: Basit hesaplama
    console.log('Test 1: Basit toplama işlemi...');
    try {
        const result1 = await pool.execute(
            (a, b) => a + b,
            [5, 10],
            TaskPriority.NORMAL
        );
        console.log('✅ Sonuç:', result1, '(Beklenen: 15)');
    } catch (e) {
        console.log('❌ Hata:', e.message);
    }
    
    // Test 2: CPU-yoğun işlem
    console.log('\nTest 2: CPU-yoğun fibonacci hesaplama...');
    try {
        const start = Date.now();
        const result2 = await pool.execute(
            (n) => {
                function fib(x) {
                    if (x <= 1) return x;
                    return fib(x - 1) + fib(x - 2);
                }
                return fib(n);
            },
            [35],
            TaskPriority.HIGH
        );
        const duration = Date.now() - start;
        console.log('✅ Fibonacci(35) =', result2, `(${duration}ms)`);
    } catch (e) {
        console.log('❌ Hata:', e.message);
    }
    
    // Test 3: Async işlem
    console.log('\nTest 3: Async setTimeout işlemi...');
    try {
        const result3 = await pool.execute(
            async (ms) => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve('Tamamlandı!'), ms);
                });
            },
            [1000],
            TaskPriority.NORMAL
        );
        console.log('✅ Sonuç:', result3);
    } catch (e) {
        console.log('❌ Hata:', e.message);
    }
    
    // Test 4: Paralel işlemler
    console.log('\nTest 4: 5 paralel işlem...');
    try {
        const start = Date.now();
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                pool.execute(
                    (x) => {
                        let sum = 0;
                        for (let j = 0; j < 10000000; j++) {
                            sum += j;
                        }
                        return `Task ${x} completed`;
                    },
                    [i],
                    TaskPriority.NORMAL
                )
            );
        }
        const results = await Promise.all(promises);
        const duration = Date.now() - start;
        console.log('✅ Tüm işlemler tamamlandı:', results);
        console.log(`   Toplam süre: ${duration}ms`);
    } catch (e) {
        console.log('❌ Hata:', e.message);
    }
    
    // Test 5: Hata kontrolü
    console.log('\nTest 5: Hata fırlatma testi...');
    try {
        await pool.execute(
            () => {
                throw new Error('Test hatası');
            },
            [],
            TaskPriority.NORMAL
        );
        console.log('❌ Hata yakalanamadı!');
    } catch (e) {
        console.log('✅ Hata başarıyla yakalandı:', e.message);
    }
    
    console.log('\n=== TEST TAMAMLANDI ===\n');
    
    // Cleanup
    pool.shutdown();
    process.exit(0);
}

testWorkerPool();
