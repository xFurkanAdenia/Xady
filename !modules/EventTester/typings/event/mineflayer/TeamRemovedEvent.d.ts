import { XadyEvent } from "../XadyEvent";
export declare class TeamRemovedEvent extends XadyEvent {
    private team;
    constructor(team: any);
    getTeam(): any;
}
