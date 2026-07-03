import WioCraftModule from ".."

export default class FirstLoginEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "firstLogin",
            pattern: /^[WİOCRAFT] (.*) Sunucuya ilk kez katıldı | Hoş geldin ✦$/
        })
    }

    execute(...args: unknown[]): Promise<void> | void {
        const [username] = args[0] as string[]
        const bot = WioCraftModule.getInstance().getClient().getBot();
        bot?.chat("Hoşgeldin " + username + "!")
    }
}