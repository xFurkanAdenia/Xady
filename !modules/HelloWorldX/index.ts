import BaseModule from "../../models/BaseModule";
import chalk from "chalk";

export default class HelloWorldX extends BaseModule {
    
    onEnable(): void {
        console.log(chalk.cyan("[HelloWorldX] Modül aktif ediliyor..."));

        // 1. Config Dosyasını Oluştur ve Oku
        // Eğer dist/modules/HelloWorldX/config.yml yoksa, resources içindekini kopyalar.
        this.saveDefaultConfig();
        
        // config.yml dosyasındaki verileri obje olarak getirir.
        const config = this.getConfig();
        console.log(chalk.yellow(`[HelloWorldX] Config'den okunan mesaj: `) + config.mesaj);

        // 2. Özel bir dosyayı okuma (getResource)
        // .xext arşivi içindeki resources/ klasöründen test.txt dosyasını RAM'e çeker.
        const testFileBuffer = this.getResource("test.txt");
        if (testFileBuffer) {
            console.log(chalk.green(`[HelloWorldX] test.txt başarıyla okundu:\n`) + testFileBuffer.toString("utf8"));
        } else {
            console.log(chalk.red(`[HelloWorldX] test.txt bulunamadı!`));
        }

        // 3. Basit bir komut ekleme
        const cmdManager = this.getClient().getCommandManager();
        const cmd = new Xady.PluginCommand("helloworld", this)
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    sender.sendMessage(`§a[HelloWorldX] §f${config.mesaj}`);
                    return true;
                }
            });
        cmdManager.registerCommand(cmd);

        console.log(chalk.green("[HelloWorldX] Başarıyla yüklendi ve hazır!"));
    }

    onDisable(): void {
        console.log(chalk.red("[HelloWorldX] Modül devre dışı bırakıldı."));
    }
}