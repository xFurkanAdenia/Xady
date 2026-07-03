import Client from "../classes/Client";
export type SettingsApiLike = {
    getConfig: () => any;
    set: (keyPath: string, value: unknown) => void;
};
export default function registerModulesCommands(client: Client, settings: SettingsApiLike): void;
