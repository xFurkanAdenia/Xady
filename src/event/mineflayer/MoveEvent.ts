import { XadyEvent } from "../XadyEvent";
import { Vec3 } from "vec3";

export class MoveEvent extends XadyEvent {
    private position: Vec3;

    constructor(position: Vec3) {
        super();
        this.position = position;
    }

    getPosition(): Vec3 {
        return this.position;
    }
}
