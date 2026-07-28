import { XadyEvent } from "../../XadyEvent";
import { goals } from "mineflayer-pathfinder";

/**
 * Event fired when pathfinder reaches its goal
 */
export class GoalReachedEvent extends XadyEvent {
    private readonly goal: goals.Goal;

    constructor(goal: goals.Goal) {
        super();
        this.goal = goal;
    }

    /**
     * Get the goal that was reached
     */
    public getGoal(): goals.Goal {
        return this.goal;
    }

    static get handlerName(): string {
        return "goal_reached";
    }
}
