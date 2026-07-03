import Client from "../classes/Client";
import registerModulesCommands, { SettingsApiLike } from "./modules";
import registerSettingsCommands from "./settings";
import registerSystemCommands from "./system";

export default function registerBuiltInCommands(client: Client, settings: SettingsApiLike, openSettingsMenu: () => void) {
    registerModulesCommands(client, settings);
    registerSettingsCommands(client, openSettingsMenu);
    registerSystemCommands(client);
}
