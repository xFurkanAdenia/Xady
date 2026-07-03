import { XadyEvent } from "../XadyEvent";
export declare class SoundEffectHeardEvent extends XadyEvent {
    private soundName;
    private position;
    private volume;
    private pitch;
    constructor(soundName: string, position: any, volume: number, pitch: number);
    getSoundName(): string;
    getPosition(): any;
    getVolume(): number;
    getPitch(): number;
}
