import { XadyEvent } from "../XadyEvent";
import { Team } from "mineflayer";

export class TeamUpdatedEvent extends XadyEvent {
    private team: Team;

    constructor(team: Team) {
        super();
        this.team = team;
    }

    getTeam(): Team {
        return this.team;
    }
}
