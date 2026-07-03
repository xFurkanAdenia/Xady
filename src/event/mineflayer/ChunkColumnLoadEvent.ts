import { XadyEvent } from "../XadyEvent";
import { Vec3 } from "vec3";

export class ChunkColumnLoadEvent extends XadyEvent {
    private point: Vec3;

    constructor(point: Vec3) {
        super();
        this.point = point;
    }

    getPoint(): Vec3 {
        return this.point;
    }
}
