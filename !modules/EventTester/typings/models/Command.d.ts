import { Bot } from "../types";
import CommandSender from "./CommandSender";
export default abstract class Command {
    #private;
    constructor(name: string);
    getName(): string;
    abstract execute(bot: Bot, sender: CommandSender, args: string[]): void | Promise<void>;
}
