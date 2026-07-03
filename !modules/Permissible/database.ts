import { existsSync, readFileSync, writeFileSync } from "fs";

export default class Database {
    path: string;
    constructor(dir: string) {
        this.path = dir;
        if (!existsSync(this.path)) writeFileSync(dir, "{}")
    }

    #getJson() {
        return JSON.parse(readFileSync(this.path, "utf-8"));
    }

    get(key: string) {
        const json = this.#getJson();
        return json[key]
    }

    set(key: string, value: any) {
        const json = this.#getJson();
        json[key] = value;
        writeFileSync(this.path, JSON.stringify(json, null, 4))
    }

    delete(key: string) {
        const json = this.#getJson();
        delete json[key];
        writeFileSync(this.path, JSON.stringify(json, null, 4))
    }

    has(key: string) {
        const json = this.#getJson();
        return !!json[key]
    }

    getAll() {
        return this.#getJson();
    }
}