import { XadyEvent } from "../XadyEvent";
export declare class TeamMemberAddedEvent extends XadyEvent {
    private team;
    constructor(team: any);
    getTeam(): any;
}
