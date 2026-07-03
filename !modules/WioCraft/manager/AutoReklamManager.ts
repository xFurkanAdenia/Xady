import AutoReklam from "../model/AutoReklam";

export default class AutoReklamManager {
    private ad?: AutoReklam;
    private previousAds: Map<string, AutoReklam> = new Map();
    startAd(owner: string, message: string, interval: bigint, maxMessage: number, price = 0.0) {
        this.ad = new AutoReklam(owner, message, interval, maxMessage);
        this.ad.setStatus(true);
        this.ad.setPrice(price);
    }

    stopAd(reason: string) {
        if (this.ad) {
            this.ad.setStatus(false);
            this.ad.setReason(reason);
            this.previousAds.set(this.ad.getOwner(), this.ad);
            this.ad = undefined;
        }
    }

    getPreviousAd(owner: string) {
        return this.previousAds.get(owner);
    }

    getAd() {
        return this.ad;
    }
}