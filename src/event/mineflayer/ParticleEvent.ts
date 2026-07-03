import { XadyEvent } from "../XadyEvent";
import { Particle } from "mineflayer";

export class ParticleEvent extends XadyEvent {
    private particle: Particle;

    constructor(particle: Particle) {
        super();
        this.particle = particle;
    }

    getParticle(): Particle {
        return this.particle;
    }
}
