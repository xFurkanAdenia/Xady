import BaseModule from "../../models/BaseModule";
import { XadyEvent } from "../XadyEvent";

export class ChatPatternEvent extends XadyEvent {
    private patternName: string;
    private matches: RegExpMatchArray;
    private ownerModule?: BaseModule;

    constructor(patternName: string, matches: RegExpMatchArray, ownerModule?: BaseModule) {
        super();
        this.patternName = patternName;
        this.matches = matches;
        this.ownerModule = ownerModule;
        
        // Freeze matches to prevent event data mutation by modules
        if (this.matches) {
            Object.freeze(this.matches);
        }
    }

    getPatternName(): string {
        return this.patternName;
    }

    getMatches(): RegExpMatchArray {
        return this.matches;
    }

    getMatch(index: number): string | undefined {
        return this.matches[index];
    }

    getFullMatch(): string {
        return this.matches[0];
    }

    getOwnerModule(): BaseModule | undefined {
        return this.ownerModule;
    }

    /**
     * Named Capture Group: İsimlendirilmiş yakalama grubunun değerini döndürür.
     * Regex'te `(?<name>...)` ile tanımlanan grupları alabilirsiniz.
     * 
     * @example
     * // Pattern: /(?<player>\w+) joined/
     * event.getParam("player") // => "Steve"
     */
    getParam(name: string): string | undefined {
        return this.matches?.groups?.[name];
    }

    /**
     * Tüm named capture group'ları bir obje olarak döndürür.
     * 
     * @example
     * // Pattern: /(?<player>\w+) gave (?<amount>\d+) diamonds to (?<target>\w+)/
     * event.getParams() // => { player: "Steve", amount: "64", target: "Alex" }
     */
    getParams(): Record<string, string> | undefined {
        return this.matches?.groups ? { ...this.matches.groups } : undefined;
    }
}
