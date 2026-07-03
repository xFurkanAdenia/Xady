import BaseModule from "../models/BaseModule";
import Client from "./Client";
export default class ModuleManager {
    #private;
    dir: string;
    constructor(client: Client);
    loadModules(dir: string, targetFile?: string): void;
    getModules(): Map<string, BaseModule>;
}
