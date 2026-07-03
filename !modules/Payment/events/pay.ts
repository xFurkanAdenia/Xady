import PaymentModule from "..";
import Payment, { PAYMENT_STATUS } from "../models/Payment";

//MELONYA ⇴ (.*) adlı oyuncudan (.*)⛁ alındı.
export default class PaymentEvent extends Xady.Event<any> {
    constructor() {
        super({
            name: "pay",
            pattern: /^\$(.*) (.*) oyuncusundan alınıldı\.$/,
            patternOptions: {
                repeat: true,
                parse: true
            }
        })
    }

    execute(args: string[]): Promise<void> | void {
        const [amount, username] = args[0];
        const parsedAmount = Number.parseFloat(amount.replace(/,/g, ""));
        const instance = PaymentModule.getInstance()
        const bot = instance.getClient().getBot();
        if(username === bot?.username) return;
        if (!instance.getPaymentManager().getPaymentByUser(username)) {
            bot?.chat(`/pay ${username} ${parsedAmount}`)
            bot?.chat(`/pay ${username} ${parsedAmount}`)
            bot?.whisper(username, "Aktif bir ödemeniz bulunmuyor!");
        } else {
            const payment = instance.getPaymentManager().getPaymentByUser(username) as Payment;
            if (parsedAmount < payment.getAmount()) {
                bot?.whisper(username, "Attığınız para ödemeniz için yetersiz!")
                bot?.chat(`/pay ${username} ${parsedAmount}`)
                bot?.chat(`/pay ${username} ${parsedAmount}`)
            } else if (parsedAmount > payment.getAmount()) {
                instance.getPaymentManager().getPaymentByUser(username)?.delete();
                const change = parsedAmount - payment.getAmount();
                bot?.chat(`/pay ${username} ${change}`);
                bot?.chat(`/pay ${username} ${change}`);
                payment.setStatus(PAYMENT_STATUS.SUCCESS);
                payment.setChange(change);
                payment.setSendedMoney(parsedAmount);
                bot?.whisper(username, "Ödemeniz onaylandı! Para üstü: " + Intl.NumberFormat().format(change));
                payment.callback(payment);
                payment.delete();
            } else {
                instance.getPaymentManager().getPaymentByUser(username)?.delete();
                payment.setStatus(PAYMENT_STATUS.SUCCESS);
                payment.setSendedMoney(parsedAmount);
                payment.setChange(0);
                bot?.whisper(username, "Ödemeniz onaylandı!")
                payment.callback(payment);
            }
        }
    }
}