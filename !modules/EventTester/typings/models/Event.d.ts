import { BotEvents, chatPatternOptions } from "mineflayer";
import { EventArguments } from "../types";
export default abstract class Event<K extends keyof BotEvents> {
    #private;
    constructor({ name, pattern, patternOptions, once }: EventArguments<K>);
    execute(...args: Parameters<BotEvents[K]>): Promise<void> | void;
    getName(): string;
    getPattern(): RegExp | undefined;
    getPatternOptions(): chatPatternOptions;
    getRawName(): string;
    isOnce(): boolean;
}
