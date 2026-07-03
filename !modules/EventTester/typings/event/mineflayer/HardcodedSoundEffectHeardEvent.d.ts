import { XadyEvent } from "../XadyEvent";
export declare class HardcodedSoundEffectHeardEvent extends XadyEvent {
    private soundId;
    private soundCategory;
    private position;
    private volume;
    private pitch;
    constructor(soundId: number, soundCategory: number, position: any, volume: number, pitch: number);
    getSoundId(): number;
    getSoundCategory(): number;
    getPosition(): any;
    getVolume(): number;
    getPitch(): number;
}
