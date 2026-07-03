import { readFileSync } from "fs";
import BaseModule from "../../models/BaseModule";
import WebPanelModule from "../WebPanel";
import PaymentManager from "./manager/PaymentManager";
import Payment from "./models/Payment";
import path from "path";
export default class PaymentModule extends Xady.Module {
    static #instance: PaymentModule;
    paymentManager!: PaymentManager;
    #botCreateListener?: () => void;
    onEnable(): void {
        PaymentModule.#instance = this;
        const client = this.getClient();
        this.paymentManager = new PaymentManager();
        const testPanel: WebPanelModule = PaymentModule.getModule<WebPanelModule>("WebPanel");

        // Menüye Ekle (Sidebar)
        testPanel.webApi?.registerNav({
            id: "payment_test",
            title: "Payment",
            path: "/payment"
        });

        // Sayfa İçeriğini (HTML) Kaydet
        testPanel.webApi?.registerView("/payment", async (req, ctx) => {
            const buf = this.getResource("views/index.html");
            if (buf) return buf.toString("utf8");
            return "<h1>Payment Error: View not found in resources!</h1>";
        });
        const load = () => {
            const bot = client.getBot();
            const eventsPath = path.join(__dirname, "events");
            bot?.loadEvents(eventsPath);
        };
        if (client.getBot()) {
            load();
        }
        this.#botCreateListener = load;
        client.on("botCreate", this.#botCreateListener);
        const cmd = new Xady.PluginCommand("testpayment", this)
            .setExecutor({
                onCommand: async (sender, command, label, args) => {
                    console.log(sender.getName());
                    this.getPaymentManager().createPayment(sender.getName(), Number.parseFloat(args[0]), async (payment) => {
                        sender.sendMessage(payment.getAmount() + " para gönderildi " + payment.getId() + " id'li odeme " + "Para Üstü: " + payment.getChange());
                        payment.setDeleteAfterCallback(false);
                        console.log((this.paymentManager.getPaymentByUser(sender.getName())?.getAmount()));
                    });
                    sender.sendMessage("Ödemeniz başlatıldı");
                    return true;
                }
            });
        this.getClient().getCommandManager().registerCommand(cmd);
    }

    onDisable(): void {
        if (this.#botCreateListener) {
            this.getClient().off("botCreate", this.#botCreateListener);
        }
    }

    getPaymentManager() {
        return this.paymentManager;
    }

    public static getInstance() {
        return this.#instance
    }
}