import "../../typings/xady";
import { GoalReachedEvent, PathUpdateEvent, GoalUpdatedEvent, PathResetEvent, PathStopEvent } from "../../../../src/event/mineflayer/EventRegistry";

export default class PathfinderListener implements Xady.Listener {
    @Xady.EventHandler()
    onGoalReached(event: GoalReachedEvent) {
        console.log(`[Pathfinder] Goal reached!`, event.getGoal());
    }

    @Xady.EventHandler()
    onPathUpdate(event: PathUpdateEvent) {
        const status = event.getStatus();
        const path = event.getPath();
        
        console.log(`[Pathfinder] Path updated - Status: ${status}`);
        console.log(`  - Cost: ${path.cost}`);
        console.log(`  - Time: ${path.time}ms`);
        console.log(`  - Visited nodes: ${path.visitedNodes}`);
        console.log(`  - Generated nodes: ${path.generatedNodes}`);
        console.log(`  - Path length: ${path.path.length} moves`);
        
        if (status === "success") {
            console.log(`[Pathfinder] ✓ Full path found!`);
        } else if (status === "partial") {
            console.log(`[Pathfinder] ⚠ Partial path, continuing computation...`);
        } else if (status === "timeout") {
            console.log(`[Pathfinder] ⏱ Path computation timed out`);
        } else if (status === "noPath") {
            console.log(`[Pathfinder] ✗ No path found`);
        }
    }

    @Xady.EventHandler()
    onGoalUpdated(event: GoalUpdatedEvent) {
        const goal = event.getGoal();
        const dynamic = event.isDynamic();
        
        console.log(`[Pathfinder] New goal assigned (dynamic: ${dynamic})`, goal);
    }

    @Xady.EventHandler()
    onPathReset(event: PathResetEvent) {
        const reason = event.getReason();
        
        console.log(`[Pathfinder] Path reset - Reason: ${reason}`);
        
        if (event.isStuck()) {
            console.log(`[Pathfinder] ⚠ Bot appears to be stuck!`);
        } else if (event.isDigError()) {
            console.log(`[Pathfinder] ⚠ Digging error occurred`);
        } else if (event.isPlaceError()) {
            console.log(`[Pathfinder] ⚠ Block placement error occurred`);
        } else if (event.isNoScaffoldingBlocks()) {
            console.log(`[Pathfinder] ⚠ No scaffolding blocks available`);
        }
    }

    @Xady.EventHandler()
    onPathStop(event: PathStopEvent) {
        console.log(`[Pathfinder] Pathfinding stopped`);
    }
}
