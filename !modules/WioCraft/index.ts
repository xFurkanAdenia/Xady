import PaymentModule from "../Payment";
import PermissibleModule from "../Permissible";
import AutoReklamManager from "./manager/AutoReklamManager";
import path from "node:path";
export default class WioCraftModule extends Xady.Module {
    static #instance: WioCraftModule;
    #autoReklamManager!: AutoReklamManager; 
    #permissible!: PermissibleModule;
    #payment!: PaymentModule;
    #botCreateListener?: () => void;
    onEnable() {
        WioCraftModule.#instance = this;
        this.#permissible = WioCraftModule.getModule<PermissibleModule>("Permissible");
        this.#payment = WioCraftModule.getModule<PaymentModule>("Payment");
        this.#autoReklamManager = new AutoReklamManager();
        const client = this.getClient();
        const load = () => {
            const bot = client.getBot();
            if (bot) {
                console.log("WioCraft Bot Core: Loading events...");
                bot.loadEvents(path.join(this.getExecDir(), "src", "listeners"));
            }
        };        if (client.getBot()) {
            load();
        }
        this.#botCreateListener = load;
        client.on("botCreate", this.#botCreateListener);
    }
    onDisable() {
        console.log("WioCraft Bot Core Disabled");
        if (this.#botCreateListener) {
            this.getClient().off("botCreate", this.#botCreateListener);
        }
    }
    static getInstance(): WioCraftModule {
        return WioCraftModule.#instance;
    }
    getAutoReklamManager(): AutoReklamManager {
        return this.#autoReklamManager;
    }
    getPermissible(): PermissibleModule {
        return this.#permissible;
    }
    getPayment(): PaymentModule {
        return this.#payment;
    }
}