import { XadyEvent } from "../../XadyEvent";
import { goals } from "mineflayer-pathfinder";

/**
 * Event fired whenever a new goal is assigned to pathfinder
 */
export class GoalUpdatedEvent extends XadyEvent {
    private readonly goal: goals.Goal;
    private readonly dynamic: boolean;

    constructor(goal: goals.Goal, dynamic: boolean = false) {
        super();
        this.goal = goal;
        this.dynamic = dynamic;
    }

    /**
     * Get the new goal assigned to pathfinder
     */
    public getGoal(): goals.Goal {
        return this.goal;
    }

    /**
     * Check if the goal is dynamic
     */
    public isDynamic(): boolean {
        return this.dynamic;
    }

    static get handlerName(): string {
        return "goal_updated";
    }
}
