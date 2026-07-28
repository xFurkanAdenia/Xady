import "../typings/xady";
import PathfinderListener from "./listeners/PathfinderListener";

export default class PathfinderExampleModule extends Xady.Module {
    onEnable() {
        this.registerEvents(new PathfinderListener());
        this.getLogger().info("PathfinderExample module enabled!");
        this.getLogger().info("All pathfinder events are now being captured by EventBus");
    }

    onDisable() {
        this.getLogger().info("PathfinderExample module disabled!");
    }
}
