import { IModuleManifest } from "../types";


export default class ModuleManifest {
    #name: string;
    #description: string;
    #version: string
    #main: string;
    #dependencies: string[];
    #softDependencies: string[];
    #loadBefore: string[];
    #permissions: string[];
    #apiVersion?: string;
    #author?: string | string[];
    #website?: string;
    #load?: "STARTUP" | "LOGIN" | "SPAWN";
    #commands?: Record<string, any>;

    constructor(data: IModuleManifest) {
        this.#name = data.name;
        this.#description = data.description;
        this.#version = data.version;
        this.#main = data.main;
        this.#dependencies = data.dependencies ?? [];
        this.#softDependencies = data.softDependencies ?? [];
        this.#loadBefore = data.loadBefore ?? [];
        this.#permissions = data.permissions ?? [];
        this.#apiVersion = data["api-version"];
        this.#author = data.author;
        this.#website = data.website;
        this.#load = data.load;
        this.#commands = data.commands;
    }

    getName() { return this.#name; }
    getMain() { return this.#main; }
    getDescription() { return this.#description; }
    getVersion() { return this.#version; }
    getDependencies() { return this.#dependencies; }
    getSoftDependencies() { return this.#softDependencies; }
    getLoadBefore() { return this.#loadBefore; }
    getPermissions() { return this.#permissions; }
    getApiVersion() { return this.#apiVersion; }
    getAuthor() { return this.#author; }
    getWebsite() { return this.#website; }
    getLoadPhase() { return this.#load; }
    getCommands() { return this.#commands; }
}