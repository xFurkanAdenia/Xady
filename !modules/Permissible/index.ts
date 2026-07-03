import PermissionManager from "./manager/PermissionManager";
import path from "node:path";
export default class PermissibleModule extends Xady.Module {
    static #instance: PermissibleModule;
    #permissionManager!: PermissionManager;
    onEnable(): void {
        PermissibleModule.#instance = this;
        this.#permissionManager = new PermissionManager(this); // ← this'i geç
        this.#permissionManager.loadUsers();
        const commandManager = this.getClient().getCommandManager();
        commandManager.loadCommands(path.join(this.getExecDir(), "src", "commands"))
    }
    onDisable(): void {
        this.#permissionManager.saveAll()
    }

    public static getInstance() {
        return this.#instance;
    }

    public getPermissionManager() {
        return this.#permissionManager;
    }
}