import { BotEvents, chatPatternOptions } from "mineflayer";
import { EventArguments } from "../types";



export default abstract class Event<K extends keyof BotEvents> {
    #name: string;
    #rawName: string;
    #once: boolean;
    #pattern?: RegExp;
    #patternOptions: chatPatternOptions;
    constructor({ name, pattern, patternOptions, once }: EventArguments<K>) {
        this.#once = once ?? false;
        this.#pattern = pattern;
        this.#patternOptions = patternOptions ?? { repeat: true, parse: true };
        this.#rawName = name;
        this.#name = pattern ? "chat:" + name : name;
    }
    execute(...args: Parameters<BotEvents[K]>): Promise<void> | void {
        throw new Error("Method not implemented");
    }

    getName() {
        return this.#name;
    }

    getPattern() {
        return this.#pattern;
    }

    getPatternOptions() {
        return this.#patternOptions;
    }

    getRawName() {
        return this.#rawName;
    }

    isOnce() {
        return this.#once;
    }
}