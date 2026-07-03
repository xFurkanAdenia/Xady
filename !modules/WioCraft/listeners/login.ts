import WioCraftModule from "..";
export default class LoginEvent extends Xady.Event<any> {
    constructor() {
        super({ 
            name: "login",
            pattern: /WioCraft » Lütfen \/login <şifre> yazarak giriş yap,/i,
            patternOptions: {
                repeat: true,
                parse: true
            }
        })
    }

    execute(): Promise<void> | void {
        const client = WioCraftModule.getInstance().getClient();
        const bot = client.getBot();
        bot?.chat(`/login Furkan12123!`);
    }
}