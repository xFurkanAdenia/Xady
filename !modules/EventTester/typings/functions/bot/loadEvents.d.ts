import Event from "../../models/Event";
import { Bot } from "../../types";
import { BotEvents } from "mineflayer";
import Client from "../../classes/Client";
export default function loadEvents(bot: Bot, client: Client, dir: string): Event<keyof BotEvents>[];
