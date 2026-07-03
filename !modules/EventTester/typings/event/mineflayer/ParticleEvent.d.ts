import { XadyEvent } from "../XadyEvent";
export declare class ParticleEvent extends XadyEvent {
    private particle;
    constructor(particle: any);
    getParticle(): any;
}
