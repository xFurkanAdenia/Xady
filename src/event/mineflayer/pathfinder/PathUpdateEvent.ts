import { XadyEvent } from "../../XadyEvent";
import { PartiallyComputedPath } from "mineflayer-pathfinder";

export type PathStatus = "success" | "partial" | "timeout" | "noPath";

/**
 * Event fired whenever pathfinder recalculates the path
 */
export class PathUpdateEvent extends XadyEvent {
    private readonly path: PartiallyComputedPath;

    constructor(path: PartiallyComputedPath) {
        super();
        this.path = path;
    }

    /**
     * Get the path calculation status
     * - success: a path has been found
     * - partial: a partial path has been found, computations will continue next tick
     * - timeout: timed out
     * - noPath: no path was found
     */
    public getStatus(): PathStatus {
        return this.path.status;
    }

    /**
     * Get the calculated path
     */
    public getPath(): PartiallyComputedPath {
        return this.path;
    }

    /**
     * Get the cost of the path
     */
    public getCost(): number {
        return this.path.cost;
    }

    /**
     * Get the time taken to compute the path (ms)
     */
    public getTime(): number {
        return this.path.time;
    }

    /**
     * Get number of nodes visited during pathfinding
     */
    public getVisitedNodes(): number {
        return this.path.visitedNodes;
    }

    /**
     * Get number of nodes generated during pathfinding
     */
    public getGeneratedNodes(): number {
        return this.path.generatedNodes;
    }

    static get handlerName(): string {
        return "path_update";
    }
}
