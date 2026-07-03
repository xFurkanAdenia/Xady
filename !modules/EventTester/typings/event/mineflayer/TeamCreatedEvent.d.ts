import { XadyEvent } from "../XadyEvent";
export declare class TeamCreatedEvent extends XadyEvent {
    private team;
    constructor(team: any);
    getTeam(): any;
}
