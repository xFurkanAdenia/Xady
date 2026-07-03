import { XadyEvent } from "../XadyEvent";
import { Vec3 } from "vec3";

export class SoundEffectHeardEvent extends XadyEvent {
    private soundName: string;
    private position: Vec3;
    private volume: number;
    private pitch: number;

    constructor(soundName: string, position: Vec3, volume: number, pitch: number) {
        super();
        this.soundName = soundName;
        this.position = position;
        this.volume = volume;
        this.pitch = pitch;
    }

    getSoundName(): string {
        return this.soundName;
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
