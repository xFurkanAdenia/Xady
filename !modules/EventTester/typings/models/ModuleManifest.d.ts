import { IModuleManifest } from "../types";
export default class ModuleManifest {
    #private;
    constructor(data: IModuleManifest);
    getName(): string;
    getMain(): string;
    getDescription(): string;
    getVersion(): string;
    getDependencies(): string[];
    getSoftDependencies(): string[];
    getLoadBefore(): string[];
    getPermissions(): string[];
    getApiVersion(): string | undefined;
    getAuthor(): string | string[] | undefined;
    getWebsite(): string | undefined;
    getLoadPhase(): "STARTUP" | "LOGIN" | "SPAWN" | undefined;
    getCommands(): Record<string, any> | undefined;
}
