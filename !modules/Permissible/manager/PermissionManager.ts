import PermissibleModule from "..";
import Database from "../database";
import path from "node:path"
import User from "../models/User";

export default class PermissionManager {
    db: Database;
    users: Map<number, User>;
    private userIdOrder: number;
    constructor(module: PermissibleModule) {
        this.users = new Map();
        this.userIdOrder = 0;
        this.db = new Database(path.join(module.getExecDir(), "db.json"))
        if (!this.db.has("users")) this.db.set("users", {})
    }

    saveAll() {
        const users = this.db.get("users");
        this.users.forEach(v => {
            users[v.getId()] = {
                name: v.getName(),
                id: v.getId(),
                permissions: v.getPermissions()
            };
        });
        this.db.set("users", users)
        console.log("Saved " + this.users.size + " users...")
    }

    loadUsers() {
        const users = Object.values(this.db.get("users"));
        users.forEach((v: any) => {
            if (v.id > this.userIdOrder) this.userIdOrder = v.id;
            console.log(v.permissions)
            this.users.set(v.id, new User(v.id, v.name, v.permissions))
        });
        console.log(`Loaded ${this.users.size} users!`);
    }

    createUser(user: XadyGlobal["CommandSender"], permissions?: string[]): User
    createUser(user: string, permissions?: string[]): User
    createUser(user: XadyGlobal["CommandSender"] | string, permissions?: string[]): User | undefined {
        let username;
        let isConsole = false;
        if (typeof user == "string") {
            username = user;
        } else if (user instanceof Xady.CommandSender) {
            username = user.getName();
            isConsole = user instanceof Xady.ConsoleCommandSender;
        } else return undefined;
        if (!this.getUser(username) && !isConsole) {
            this.userIdOrder++;
            const user = new User(this.userIdOrder, username, permissions ?? []);
            this.users.set(this.userIdOrder, user);
            return user;
        } else return this.getUser(username)
    }

    getUser(user: XadyGlobal["CommandSender"]): User
    getUser(user: string): User
    getUser(user: XadyGlobal["CommandSender"] | string): User | undefined {
        let username;
        if (typeof user == "string") {
            username = user;
        } else if (user instanceof Xady.CommandSender) {
            username = user.getName();
        } else return undefined

        return this.users.values().filter(v => v.getName() === username).next().value
    }

    hasPermission(user: InstanceType<XadyGlobal["CommandSender"]>, permission: string): boolean
    hasPermission(user: string, permission: string): boolean
    hasPermission(user: InstanceType<XadyGlobal["CommandSender"]> | string, permission: string): boolean {
        let username;
        let isConsole = false;
        if (typeof user == "string") {
            username = user;
        } else if (user instanceof Xady.CommandSender) {
            username = user.getName();
            isConsole = user instanceof Xady.ConsoleCommandSender
        } else return false
        if (!isConsole && !this.getUser(username)) this.createUser(username);
        return isConsole || this.getUser(username).getPermissions().includes(permission) || this.getUser(username).getPermissions().includes("*");
    }
}