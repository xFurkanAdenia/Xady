import { Bot } from "../types";
import CommandSender from "./CommandSender";

export default abstract class Command {
    #name: string;
    constructor(name: string) {
        this.#name = name.toLowerCase();
    }

    getName() {
        return this.#name;
    }

    abstract execute(bot: Bot, sender: CommandSender, args: string[]): void | Promise<void>
}