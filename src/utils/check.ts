import ModuleManifest from "../models/ModuleManifest";
import { IModuleManifest } from "../types";

function isValidManifestData(obj: unknown): obj is IModuleManifest {
    if (typeof obj !== 'object' || obj === null) return false;
    const data = obj as Record<string, unknown>;
    return (
        typeof data.name === 'string' &&
        typeof data.description === 'string' &&
        typeof data.main === 'string' &&
        typeof data.version === 'string'
    );
}

export function checkModuleJsonManifest(manifestRaw: string): ModuleManifest | null {
    try {
        const manifestObj: unknown = JSON.parse(manifestRaw);
        if (!isValidManifestData(manifestObj)) {
            return null;
        }
        return new ModuleManifest(manifestObj);
    } catch {
        try {
            const yaml = require("yaml");
            const manifestObj: unknown = yaml.parse(manifestRaw);
            if (!isValidManifestData(manifestObj)) {
                return null;
            }
            return new ModuleManifest(manifestObj);
        } catch {
            return null;
        }
    }
}