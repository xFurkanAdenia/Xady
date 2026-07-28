import { XadyEvent } from "../../XadyEvent";

/**
 * Event fired when pathfinding is stopped by bot.pathfinder.stop()
 */
export class PathStopEvent extends XadyEvent {
    constructor() {
        super();
    }

    static get handlerName(): string {
        return "path_stop";
    }
}
