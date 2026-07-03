import { XadyEvent } from "../XadyEvent";
export declare class EntityAttachEvent extends XadyEvent {
    private entity;
    private vehicle;
    constructor(entity: any, vehicle: any);
    getEntity(): any;
    getVehicle(): any;
}
