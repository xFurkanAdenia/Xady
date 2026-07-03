import { XadyEvent } from "../XadyEvent";
export declare class TeamMemberRemovedEvent extends XadyEvent {
    private team;
    constructor(team: any);
    getTeam(): any;
}
