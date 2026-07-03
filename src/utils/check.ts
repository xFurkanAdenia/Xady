import ModuleManifest from "../models/ModuleManifest";

export function checkModuleJsonManifest(manifestRaw: string): ModuleManifest | null {
    try {
        const manifestObj = JSON.parse(manifestRaw);
        if (!manifestObj.name || !manifestObj.main || !manifestObj.version) {
            return null;
        }
        return new ModuleManifest(manifestObj);
    } catch {
        try {
            const yaml = require("yaml");
            const manifestObj = yaml.parse(manifestRaw);
            if (!manifestObj.name || !manifestObj.main || !manifestObj.version) {
                return null;
            }
            return new ModuleManifest(manifestObj);
        } catch {
            return null;
        }
    }
}