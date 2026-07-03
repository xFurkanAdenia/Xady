import { XadyEvent } from "../XadyEvent";
import { Vec3 } from "vec3";

export class HardcodedSoundEffectHeardEvent extends XadyEvent {
    private soundId: number;
    private soundCategory: number;
    private position: Vec3;
    private volume: number;
    private pitch: number;

    constructor(soundId: number, soundCategory: number, position: Vec3, volume: number, pitch: number) {
        super();
        this.soundId = soundId;
        this.soundCategory = soundCategory;
        this.position = position;
        this.volume = volume;
        this.pitch = pitch;
    }

    getSoundId(): number {
        return this.soundId;
    }

    getSoundCategory(): number {
        return this.soundCategory;
    }

    getPosition(): Vec3 {
        return this.position;
    }

    getVolume(): number {
        return this.volume;
    }

    getPitch(): number {
        return this.pitch;
    }
}
