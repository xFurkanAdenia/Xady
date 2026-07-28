import { XadyEvent } from "../../XadyEvent";

export type PathResetReason = 
    | "goal_updated" 
    | "movements_updated" 
    | "block_updated" 
    | "chunk_loaded" 
    | "goal_moved" 
    | "dig_error" 
    | "no_scaffolding_blocks" 
    | "place_error" 
    | "stuck";

/**
 * Event fired when pathfinder resets the path
 */
export class PathResetEvent extends XadyEvent {
    private readonly reason: PathResetReason;

    constructor(reason: PathResetReason) {
        super();
        this.reason = reason;
    }

    /**
     * Get the reason why the path was reset
     */
    public getReason(): PathResetReason {
        return this.reason;
    }

    /**
     * Check if path was reset due to goal update
     */
    public isGoalUpdated(): boolean {
        return this.reason === "goal_updated";
    }

    /**
     * Check if path was reset due to movements update
     */
    public isMovementsUpdated(): boolean {
        return this.reason === "movements_updated";
    }

    /**
     * Check if path was reset due to block update
     */
    public isBlockUpdated(): boolean {
        return this.reason === "block_updated";
    }

    /**
     * Check if path was reset due to chunk loading
     */
    public isChunkLoaded(): boolean {
        return this.reason === "chunk_loaded";
    }

    /**
     * Check if path was reset because goal moved
     */
    public isGoalMoved(): boolean {
        return this.reason === "goal_moved";
    }

    /**
     * Check if path was reset due to digging error
     */
    public isDigError(): boolean {
        return this.reason === "dig_error";
    }

    /**
     * Check if path was reset due to no scaffolding blocks
     */
    public isNoScaffoldingBlocks(): boolean {
        return this.reason === "no_scaffolding_blocks";
    }

    /**
     * Check if path was reset due to block placement error
     */
    public isPlaceError(): boolean {
        return this.reason === "place_error";
    }

    /**
     * Check if path was reset because bot is stuck
     */
    public isStuck(): boolean {
        return this.reason === "stuck";
    }

    static get handlerName(): string {
        return "path_reset";
    }
}
