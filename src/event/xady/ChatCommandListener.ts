import chalk from "chalk";
import Client from "../../classes/Client";
import { Listener } from "../Listener";
import { EventHandler } from "../EventHandler";
import { EventPriority } from "../EventPriority";
import { PlayerChatEvent } from "../mineflayer/PlayerChatEvent";
import { error, xady } from "../../utils/prefix";

export class ChatCommandListener implements Listener {
  private getClient: () => Client | undefined;

  constructor(getClient: () => Client | undefined) {
    this.getClient = getClient;
  }

  @EventHandler(EventPriority.HIGHEST)
  async onPlayerChat(event: PlayerChatEvent) {
    const client = this.getClient();
    if (!client) return;

    const message = event.getMessage();
    const username = event.getUsername();
    
    // Sadece kendi mesajlarımızı işle
    if (username !== client.getBot()?.username) return;
    
    // Komut mu kontrol et
    if (!message.startsWith("!")) return;
    
    // Komutu parse et
    const parts = message.trim().split(/\s+/);
    const cmdName = parts[0]!.substring(1).toLowerCase();
    const args = parts.slice(1);
    
    const command = client.getCommandManager().getCommand(cmdName);
    if (!command) return;
    
    // Komutu çalıştır
    const sender = client.getConsoleCommandSender();
    if (!sender) return;
    
    try {
      await command.execute(sender, cmdName, args);
    } catch (err) {
      console.error(xady + error + chalk.red(" Komut çalıştırılırken hata:"), err);
    }
  }
}
