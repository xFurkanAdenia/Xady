import { BotOptions, createBot } from "mineflayer";
import { Bot } from "../../types";
import loadEvents from "./loadEvents";
import Client from "../../classes/Client";
import { SocksClient } from "socks";
import * as net from "net";
import * as http from "http";

export default function(client: Client, options: BotOptions): Bot {
    // Check proxy settings from global config
    const proxyCfg = (globalThis as any).Xady?.settings?.getConfig()?.bot?.proxy;
    
    if (proxyCfg && proxyCfg.enabled && proxyCfg.host) {
        const proxyType = (proxyCfg.type || "socks5").toLowerCase();
        
        if (proxyType === "socks5" || proxyType === "socks4") {
            // SOCKS4/5 proxy via 'socks' package
            const socksType = proxyType === "socks4" ? 4 : 5;
            
            (options as any).connect = (client: any) => {
                SocksClient.createConnection({
                    proxy: {
                        host: proxyCfg.host,
                        port: proxyCfg.port || 1080,
                        type: socksType,
                        userId: proxyCfg.username || undefined,
                        password: proxyCfg.password || undefined
                    },
                    command: "connect",
                    destination: {
                        host: options.host || "localhost",
                        port: options.port || 25565
                    }
                }).then((info) => {
                    client.setSocket(info.socket);
                    client.emit("connect");
                }).catch((err) => {
                    console.error(`[Proxy] SOCKS${socksType} bağlantı hatası:`, err.message);
                    client.emit("error", err);
                });
            };
            
            console.log(`[Proxy] SOCKS${socksType} proxy kullanılıyor: ${proxyCfg.host}:${proxyCfg.port}`);
        } else if (proxyType === "http" || proxyType === "https") {
            // HTTP/HTTPS CONNECT tunnel
            (options as any).connect = (mcClient: any) => {
                const connectOptions: http.RequestOptions = {
                    host: proxyCfg.host,
                    port: proxyCfg.port || 8080,
                    method: "CONNECT",
                    path: `${options.host || "localhost"}:${options.port || 25565}`,
                    headers: {} as Record<string, string>
                };
                
                // Basic auth header
                if (proxyCfg.username && proxyCfg.password) {
                    const auth = Buffer.from(`${proxyCfg.username}:${proxyCfg.password}`).toString("base64");
                    (connectOptions.headers as Record<string, string>)["Proxy-Authorization"] = `Basic ${auth}`;
                }
                
                const req = http.request(connectOptions);
                
                req.on("connect", (res, socket) => {
                    if (res.statusCode === 200) {
                        mcClient.setSocket(socket);
                        mcClient.emit("connect");
                    } else {
                        const err = new Error(`[Proxy] HTTP CONNECT failed with status ${res.statusCode}`);
                        console.error(err.message);
                        mcClient.emit("error", err);
                        socket.destroy();
                    }
                });
                
                req.on("error", (err) => {
                    console.error(`[Proxy] HTTP proxy bağlantı hatası:`, err.message);
                    mcClient.emit("error", err);
                });
                
                req.end();
            };
            
            console.log(`[Proxy] HTTP${proxyType === "https" ? "S" : ""} proxy kullanılıyor: ${proxyCfg.host}:${proxyCfg.port}`);
        }
    }
    
    const bot: Bot = createBot(options) as Bot;
    bot.loadEvents = (dir: string) => {
        return loadEvents(bot, client, dir);
    }

    return bot;
}