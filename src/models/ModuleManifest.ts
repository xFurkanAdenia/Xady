import { IModuleManifest } from "../types";

type LoadPhase = "STARTUP" | "LOGIN" | "SPAWN";

interface CommandDefinition {
    description?: string;
    usage?: string;
    aliases?: string[];
    permission?: string;
    'permission-message'?: string;
}

export default class ModuleManifest {
    readonly #name: string;
    readonly #description: string;
    readonly #version: string;
    readonly #main: string;
    readonly #dependencies: readonly string[];
    readonly #softDependencies: readonly string[];
    readonly #loadBefore: readonly string[];
    readonly #permissions: readonly string[];
    readonly #apiVersion?: string;
    readonly #author?: string | readonly string[];
    readonly #website?: string;
    readonly #load?: LoadPhase;
    readonly #commands?: Readonly<Record<string, CommandDefinition | null>>;

    constructor(data: IModuleManifest) {
        this.#name = data.name;
        this.#description = data.description;
        this.#version = data.version;
        this.#main = data.main;
        this.#dependencies = Object.freeze(data.dependencies ?? []);
        this.#softDependencies = Object.freeze(data.softDependencies ?? []);
        this.#loadBefore = Object.freeze(data.loadBefore ?? []);
        this.#permissions = Object.freeze(data.permissions ?? []);
        this.#apiVersion = data["api-version"];
        this.#author = Array.isArray(data.author) ? Object.freeze([...data.author]) : data.author;
        this.#website = data.website;
        this.#load = data.load;
        this.#commands = data.commands ? Object.freeze({ ...data.commands }) : undefined;
    }

    getName(): string { return this.#name; }
    getMain(): string { return this.#main; }
    getDescription(): string { return this.#description; }
    getVersion(): string { return this.#version; }
    getDependencies(): readonly string[] { return this.#dependencies; }
    getSoftDependencies(): readonly string[] { return this.#softDependencies; }
    getLoadBefore(): readonly string[] { return this.#loadBefore; }
    getPermissions(): readonly string[] { return this.#permissions; }
    getApiVersion(): string | undefined { return this.#apiVersion; }
    getAuthor(): string | readonly string[] | undefined { return this.#author; }
    getWebsite(): string | undefined { return this.#website; }
    getLoadPhase(): LoadPhase | undefined { return this.#load; }
    getCommands(): Readonly<Record<string, CommandDefinition | null>> | undefined { return this.#commands; }
}