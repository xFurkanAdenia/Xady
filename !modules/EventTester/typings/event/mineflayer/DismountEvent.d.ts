import { XadyEvent } from "../XadyEvent";
export declare class DismountEvent extends XadyEvent {
    private vehicle;
    constructor(vehicle: any);
    getVehicle(): any;
}
