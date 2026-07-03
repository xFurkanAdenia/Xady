import mineflayer, { BotEvents, chatPatternOptions } from "mineflayer";
import BaseModule from "../models/BaseModule";
import Event from "../models/Event";
import Response from "../classes/Response";
import CommandSender from "../models/CommandSender";
import { event, success, xady, command, error, module } from "../utils/prefix";
import Command from "../models/Command";
import ConsoleCommandSender from "../models/ConsoleCommandSender";
export interface IModuleManifest {
    name: string;
    description: string;
    version: string;
    main: string;
    "api-version"?: string;
    author?: string | string[];
    website?: string;
    load?: "STARTUP" | "LOGIN" | "SPAWN";
    dependencies?: string[];
    softDependencies?: string[];
    loadBefore?: string[];
    permissions?: string[];
    commands?: Record<string, {
        description?: string;
        aliases?: string[];
        permission?: string;
        "permission-message"?: string;
        usage?: string;
    }>;
}
export interface Bot extends mineflayer.Bot {
    loadEvents: (dir: string) => void;
    pathfinder: any;
}
export type CommandExecute = (bot: Bot, sender: CommandSender, args: string[]) => void | Promise<void>;
export interface CommandInterface {
    name: string;
    execute: CommandExecute;
}
export interface EventInterface {
    name: string;
    once?: boolean;
    pattern?: RegExp;
    execute: (...args: any) => any;
}
export type Events = {
    botCreate: () => void;
    botSpawn: (bot: Bot) => void;
    clientReady: () => void;
};
export interface CommandBuilder {
    register: () => Response;
    toJson: () => CommandInterface;
    toString: () => string;
}
export interface EventArguments<K extends keyof BotEvents> {
    name: K;
    pattern?: RegExp;
    patternOptions?: chatPatternOptions;
    once?: boolean;
}
export type SettingsItem = {
    kind: "string";
    keyPath: string;
    label: string;
} | {
    kind: "number";
    keyPath: string;
    label: string;
} | {
    kind: "boolean";
    keyPath: string;
    label: string;
} | {
    kind: "select";
    keyPath: string;
    label: string;
    options: string[];
};
export type SettingsCategory = {
    id: string;
    title: string;
    items: SettingsItem[];
};
export interface SettingsApi {
    getConfig: () => unknown;
    set: (keyPath: string, value: unknown) => void;
    registerCategory: (category: SettingsCategory) => void;
    unregisterCategory: (id: string) => void;
}
import { XadyEvent } from "../event/XadyEvent";
import { EventPriority } from "../event/EventPriority";
import { EventHandler } from "../event/EventHandler";
import * as MineflayerEvents from "../event/mineflayer/EventRegistry";
import { PluginCommand } from "../command/PluginCommand";
import { ServicePriority } from "../classes/ServiceManager";
declare global {
    interface XadyGlobal {
        Module: typeof BaseModule;
        Event: typeof Event;
        Command: typeof Command;
        ConsoleCommandSender: typeof ConsoleCommandSender;
        CommandSender: typeof CommandSender;
        XadyEvent: typeof XadyEvent;
        EventPriority: typeof EventPriority;
        EventHandler: typeof EventHandler;
        ServicePriority: typeof ServicePriority;
        PluginCommand: typeof PluginCommand;
        settings: SettingsApi;
        prefix: {
            xady: typeof xady;
            error: typeof error;
            event: typeof event;
            success: typeof success;
            command: typeof command;
            module: typeof module;
        };
        GenericMineflayerEvent: typeof MineflayerEvents.GenericMineflayerEvent;
        PlayerChatEvent: typeof MineflayerEvents.PlayerChatEvent;
        MessageEvent: typeof MineflayerEvents.MessageEvent;
        PlayerJoinEvent: typeof MineflayerEvents.PlayerJoinEvent;
        PlayerLeftEvent: typeof MineflayerEvents.PlayerLeftEvent;
        SpawnEvent: typeof MineflayerEvents.SpawnEvent;
        DeathEvent: typeof MineflayerEvents.DeathEvent;
        HealthEvent: typeof MineflayerEvents.HealthEvent;
        KickedEvent: typeof MineflayerEvents.KickedEvent;
        EndEvent: typeof MineflayerEvents.EndEvent;
        ErrorEvent: typeof MineflayerEvents.ErrorEvent;
        WhisperEvent: typeof MineflayerEvents.WhisperEvent;
        EntitySpawnEvent: typeof MineflayerEvents.EntitySpawnEvent;
        EntityGoneEvent: typeof MineflayerEvents.EntityGoneEvent;
        ActionBarEvent: typeof MineflayerEvents.ActionBarEvent;
        MessageStrEvent: typeof MineflayerEvents.MessageStrEvent;
        UnmatchedMessageEvent: typeof MineflayerEvents.UnmatchedMessageEvent;
        InjectAllowedEvent: typeof MineflayerEvents.InjectAllowedEvent;
        LoginEvent: typeof MineflayerEvents.LoginEvent;
        RespawnEvent: typeof MineflayerEvents.RespawnEvent;
        GameEvent: typeof MineflayerEvents.GameEvent;
        TitleEvent: typeof MineflayerEvents.TitleEvent;
        RainEvent: typeof MineflayerEvents.RainEvent;
        TimeEvent: typeof MineflayerEvents.TimeEvent;
        SpawnResetEvent: typeof MineflayerEvents.SpawnResetEvent;
        BreathEvent: typeof MineflayerEvents.BreathEvent;
        MoveEvent: typeof MineflayerEvents.MoveEvent;
        ForcedMoveEvent: typeof MineflayerEvents.ForcedMoveEvent;
        MountEvent: typeof MineflayerEvents.MountEvent;
        DismountEvent: typeof MineflayerEvents.DismountEvent;
        SleepEvent: typeof MineflayerEvents.SleepEvent;
        WakeEvent: typeof MineflayerEvents.WakeEvent;
        ExperienceEvent: typeof MineflayerEvents.ExperienceEvent;
        UsedFireworkEvent: typeof MineflayerEvents.UsedFireworkEvent;
        EntitySwingArmEvent: typeof MineflayerEvents.EntitySwingArmEvent;
        EntityHurtEvent: typeof MineflayerEvents.EntityHurtEvent;
        EntityDeadEvent: typeof MineflayerEvents.EntityDeadEvent;
        EntityTamingEvent: typeof MineflayerEvents.EntityTamingEvent;
        EntityTamedEvent: typeof MineflayerEvents.EntityTamedEvent;
        EntityShakingOffWaterEvent: typeof MineflayerEvents.EntityShakingOffWaterEvent;
        EntityEatingGrassEvent: typeof MineflayerEvents.EntityEatingGrassEvent;
        EntityHandSwapEvent: typeof MineflayerEvents.EntityHandSwapEvent;
        EntityWakeEvent: typeof MineflayerEvents.EntityWakeEvent;
        EntityEatEvent: typeof MineflayerEvents.EntityEatEvent;
        EntityCriticalEffectEvent: typeof MineflayerEvents.EntityCriticalEffectEvent;
        EntityMagicCriticalEffectEvent: typeof MineflayerEvents.EntityMagicCriticalEffectEvent;
        EntityCrouchEvent: typeof MineflayerEvents.EntityCrouchEvent;
        EntityUncrouchEvent: typeof MineflayerEvents.EntityUncrouchEvent;
        EntityEquipEvent: typeof MineflayerEvents.EntityEquipEvent;
        EntitySleepEvent: typeof MineflayerEvents.EntitySleepEvent;
        EntityElytraFlewEvent: typeof MineflayerEvents.EntityElytraFlewEvent;
        ItemDropEvent: typeof MineflayerEvents.ItemDropEvent;
        PlayerCollectEvent: typeof MineflayerEvents.PlayerCollectEvent;
        EntityAttributesEvent: typeof MineflayerEvents.EntityAttributesEvent;
        EntityMovedEvent: typeof MineflayerEvents.EntityMovedEvent;
        EntityDetachEvent: typeof MineflayerEvents.EntityDetachEvent;
        EntityAttachEvent: typeof MineflayerEvents.EntityAttachEvent;
        EntityUpdateEvent: typeof MineflayerEvents.EntityUpdateEvent;
        EntityEffectEvent: typeof MineflayerEvents.EntityEffectEvent;
        EntityEffectEndEvent: typeof MineflayerEvents.EntityEffectEndEvent;
        PlayerUpdatedEvent: typeof MineflayerEvents.PlayerUpdatedEvent;
        BlockUpdateEvent: typeof MineflayerEvents.BlockUpdateEvent;
        ChunkColumnLoadEvent: typeof MineflayerEvents.ChunkColumnLoadEvent;
        ChunkColumnUnloadEvent: typeof MineflayerEvents.ChunkColumnUnloadEvent;
        SoundEffectHeardEvent: typeof MineflayerEvents.SoundEffectHeardEvent;
        HardcodedSoundEffectHeardEvent: typeof MineflayerEvents.HardcodedSoundEffectHeardEvent;
        NoteHeardEvent: typeof MineflayerEvents.NoteHeardEvent;
        PistonMoveEvent: typeof MineflayerEvents.PistonMoveEvent;
        ChestLidMoveEvent: typeof MineflayerEvents.ChestLidMoveEvent;
        BlockBreakProgressObservedEvent: typeof MineflayerEvents.BlockBreakProgressObservedEvent;
        BlockBreakProgressEndEvent: typeof MineflayerEvents.BlockBreakProgressEndEvent;
        DiggingCompletedEvent: typeof MineflayerEvents.DiggingCompletedEvent;
        DiggingAbortedEvent: typeof MineflayerEvents.DiggingAbortedEvent;
        WindowOpenEvent: typeof MineflayerEvents.WindowOpenEvent;
        WindowCloseEvent: typeof MineflayerEvents.WindowCloseEvent;
        PhysicsTickEvent: typeof MineflayerEvents.PhysicsTickEvent;
        ScoreboardCreatedEvent: typeof MineflayerEvents.ScoreboardCreatedEvent;
        ScoreboardDeletedEvent: typeof MineflayerEvents.ScoreboardDeletedEvent;
        ScoreboardTitleChangedEvent: typeof MineflayerEvents.ScoreboardTitleChangedEvent;
        ScoreUpdatedEvent: typeof MineflayerEvents.ScoreUpdatedEvent;
        ScoreRemovedEvent: typeof MineflayerEvents.ScoreRemovedEvent;
        ScoreboardPositionEvent: typeof MineflayerEvents.ScoreboardPositionEvent;
        TeamCreatedEvent: typeof MineflayerEvents.TeamCreatedEvent;
        TeamRemovedEvent: typeof MineflayerEvents.TeamRemovedEvent;
        TeamUpdatedEvent: typeof MineflayerEvents.TeamUpdatedEvent;
        TeamMemberAddedEvent: typeof MineflayerEvents.TeamMemberAddedEvent;
        TeamMemberRemovedEvent: typeof MineflayerEvents.TeamMemberRemovedEvent;
        BossBarCreatedEvent: typeof MineflayerEvents.BossBarCreatedEvent;
        BossBarDeletedEvent: typeof MineflayerEvents.BossBarDeletedEvent;
        BossBarUpdatedEvent: typeof MineflayerEvents.BossBarUpdatedEvent;
        ResourcePackEvent: typeof MineflayerEvents.ResourcePackEvent;
        ParticleEvent: typeof MineflayerEvents.ParticleEvent;
    }
    var Xady: XadyGlobal;
}
export {};
