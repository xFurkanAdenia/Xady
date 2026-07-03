import ChatGamePlusModule from "..";
import MessageEventData from "../../WioCraft/listeners/message"

export default class MessageEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "wiocraft:chat"
        })
    }

    execute(data: MessageEventData) {
        const {nick: username, message} = data
        const instance = ChatGamePlusModule.getInstance();
        const bot = instance.getClient().getBot();
        if(username == bot?.username) return;
        if(!instance.gameData) return;
        if(message == instance.gameData.text) {
            bot?.chat(username + " " + instance.gameData.text + " yazdı!");
            bot?.chat("/pay " + username + " " + instance.gameData.reward);
            instance.gameData = undefined
        }
    }
}