export default class User {
    private name: string;
    private id: number;
    private permissions: string[]
    constructor(id: number, name: string, permissions?: string[]) {
        this.name = name;
        this.id = id;
        this.permissions = permissions ?? [];
    }

    getName() {
        return this.name
    }

    getId() {
        return this.id;
    }

    getPermissions() {
        return this.permissions;
    }

    addPermission(permission: string) {
        if(!this.permissions.includes(permission)) this.permissions.push(permission);
    }
    removePermission(permission: string) {
        if(this.permissions.includes(permission)) this.permissions.splice(this.permissions.indexOf(permission), 1)
    }
}