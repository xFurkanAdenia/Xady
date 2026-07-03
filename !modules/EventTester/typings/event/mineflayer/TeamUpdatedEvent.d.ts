import { XadyEvent } from "../XadyEvent";
export declare class TeamUpdatedEvent extends XadyEvent {
    private team;
    constructor(team: any);
    getTeam(): any;
}
