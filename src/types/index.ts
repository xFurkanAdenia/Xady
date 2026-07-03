import { Bot as MineflayerBot, BotEvents, chatPatternOptions } from "mineflayer";
import XadyModule, { BaseModule } from "../models/BaseModule";
import Event from "../models/Event";
import Response from "../classes/Response";
import CommandSenderClass from "../models/CommandSender";
import { event, success, xady, command, error, module } from "../utils/prefix";
import CommandClass from "../models/Command";
import ConsoleCommandSenderClass from "../models/ConsoleCommandSender";

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

export interface Bot extends MineflayerBot {
    loadEvents: (dir: string) => void;
    pathfinder: unknown;
}

export type CommandExecute = (bot: Bot, sender: CommandSenderClass, args: string[]) => void | Promise<void>;
export interface CommandInterface {
    name: string;
    execute: CommandExecute;
}

export interface EventInterface {
    name: string;
    once?: boolean;
    pattern?: RegExp;
    execute: (...args: unknown[]) => unknown;
}

export type Events = {
    botCreate: () => void,
    botSpawn: (bot: Bot) => void,
    clientReady: () => void
}

export interface CommandBuilder {
    register: () => Response;
    toJson: () => CommandInterface;
    toString: () => string;
}
export interface EventArguments<K extends keyof BotEvents> {
    name: K
    pattern?: RegExp
    patternOptions?: chatPatternOptions
    once?: boolean
}

export type SettingsItem =
    | { kind: "string"; keyPath: string; label: string }
    | { kind: "number"; keyPath: string; label: string }
    | { kind: "boolean"; keyPath: string; label: string }
    | { kind: "select"; keyPath: string; label: string; options: string[] };

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

import { XadyEvent as XadyEventClass } from "../event/XadyEvent";
import { EventPriority as EventPriorityEnum } from "../event/EventPriority";
import { EventHandler as EventHandlerDecorator } from "../event/EventHandler";
import { Listener } from "../event/Listener";
import { Cancellable } from "../event/Cancellable";
import * as MineflayerEvents from "../event/mineflayer/EventRegistry";
import { PluginCommand as PluginCommandClass, ModuleCommand as ModuleCommandClass } from "../command/PluginCommand";
import { ServicePriority as ServicePriorityEnum } from "../classes/ServiceManager";
import { ConsoleCommandEvent } from "../event/xady/ConsoleCommandEvent";
import { ConsoleChatEvent } from "../event/xady/ConsoleChatEvent";
import { ChatPatternEvent } from "../event/xady/ChatPatternEvent";
import { WorkerPool as WorkerPoolClass, TaskPriority as TaskPriorityEnum } from "../classes/WorkerPool";
import { FileConfiguration as FileConfigurationClass } from "../classes/FileConfiguration";

export { default as XadyModule, BaseModule } from "../models/BaseModule";
export { default as Event } from "../models/Event";
export { default as Response } from "../classes/Response";
export { default as CommandSender } from "../models/CommandSender";
export { default as Command } from "../models/Command";
export { default as ConsoleCommandSender } from "../models/ConsoleCommandSender";
export { XadyEvent } from "../event/XadyEvent";
export { EventPriority } from "../event/EventPriority";
export { EventHandler } from "../event/EventHandler";
export { Listener } from "../event/Listener";
export { Cancellable } from "../event/Cancellable";
export * as MineflayerEvents from "../event/mineflayer/EventRegistry";
export { PluginCommand, ModuleCommand } from "../command/PluginCommand";
export { ServicePriority } from "../classes/ServiceManager";
export { ConsoleCommandEvent } from "../event/xady/ConsoleCommandEvent";
export { ConsoleChatEvent } from "../event/xady/ConsoleChatEvent";
export { ChatPatternEvent } from "../event/xady/ChatPatternEvent";
export { WorkerPool, TaskPriority } from "../classes/WorkerPool";
export { FileConfiguration } from "../classes/FileConfiguration";
export { event, success, xady, command, error, module } from "../utils/prefix";

declare global {
    namespace Xady {
        export type Module = XadyModule;
        export const Module: typeof XadyModule;

        export type BaseModule = XadyModule; // Deprecated
        export const BaseModule: typeof XadyModule;

        export type Event<K extends keyof import("mineflayer").BotEvents = any> = import("../models/Event").default<K>;
        export const Event: typeof import("../models/Event").default;

        export type Command = CommandClass;
        export const Command: typeof CommandClass;

        export type ConsoleCommandSender = ConsoleCommandSenderClass;
        export const ConsoleCommandSender: typeof ConsoleCommandSenderClass;

        export type CommandSender = CommandSenderClass;
        export const CommandSender: typeof CommandSenderClass;

        export type XadyEvent = XadyEventClass;
        export const XadyEvent: typeof XadyEventClass;

        export type EventPriority = EventPriorityEnum;
        export const EventPriority: typeof EventPriorityEnum;

        export const EventHandler: typeof EventHandlerDecorator;

        export type ServicePriority = ServicePriorityEnum;
        export const ServicePriority: typeof ServicePriorityEnum;

        export type PluginCommand = PluginCommandClass;
        export const PluginCommand: typeof PluginCommandClass;

        export type ModuleCommand = ModuleCommandClass;
        export const ModuleCommand: typeof ModuleCommandClass;

        export type WorkerPool = WorkerPoolClass;
        export const WorkerPool: typeof WorkerPoolClass;

        export type TaskPriority = TaskPriorityEnum;
        export const TaskPriority: typeof TaskPriorityEnum;

        export type FileConfiguration = FileConfigurationClass;
        export const FileConfiguration: typeof FileConfigurationClass;

        export namespace events {
            export type ConsoleCommandEvent = MineflayerEvents.ConsoleCommandEvent;
            export const ConsoleCommandEvent: typeof MineflayerEvents.ConsoleCommandEvent;
            export type ConsoleChatEvent = MineflayerEvents.ConsoleChatEvent;
            export const ConsoleChatEvent: typeof MineflayerEvents.ConsoleChatEvent;
            export type ChatPatternEvent = MineflayerEvents.ChatPatternEvent;
            export const ChatPatternEvent: typeof MineflayerEvents.ChatPatternEvent;
            
            export type GenericMineflayerEvent = MineflayerEvents.GenericMineflayerEvent;
            export const GenericMineflayerEvent: typeof MineflayerEvents.GenericMineflayerEvent;
            export type PlayerChatEvent = MineflayerEvents.PlayerChatEvent;
            export const PlayerChatEvent: typeof MineflayerEvents.PlayerChatEvent;
            export type MessageEvent = MineflayerEvents.MessageEvent;
            export const MessageEvent: typeof MineflayerEvents.MessageEvent;
            export type PlayerJoinEvent = MineflayerEvents.PlayerJoinEvent;
            export const PlayerJoinEvent: typeof MineflayerEvents.PlayerJoinEvent;
            export type PlayerLeftEvent = MineflayerEvents.PlayerLeftEvent;
            export const PlayerLeftEvent: typeof MineflayerEvents.PlayerLeftEvent;
            export type SpawnEvent = MineflayerEvents.SpawnEvent;
            export const SpawnEvent: typeof MineflayerEvents.SpawnEvent;
            export type DeathEvent = MineflayerEvents.DeathEvent;
            export const DeathEvent: typeof MineflayerEvents.DeathEvent;
            export type HealthEvent = MineflayerEvents.HealthEvent;
            export const HealthEvent: typeof MineflayerEvents.HealthEvent;
            export type KickedEvent = MineflayerEvents.KickedEvent;
            export const KickedEvent: typeof MineflayerEvents.KickedEvent;
            export type EndEvent = MineflayerEvents.EndEvent;
            export const EndEvent: typeof MineflayerEvents.EndEvent;
            export type ErrorEvent = MineflayerEvents.ErrorEvent;
            export const ErrorEvent: typeof MineflayerEvents.ErrorEvent;
            export type WhisperEvent = MineflayerEvents.WhisperEvent;
            export const WhisperEvent: typeof MineflayerEvents.WhisperEvent;
            export type EntitySpawnEvent = MineflayerEvents.EntitySpawnEvent;
            export const EntitySpawnEvent: typeof MineflayerEvents.EntitySpawnEvent;
            export type EntityGoneEvent = MineflayerEvents.EntityGoneEvent;
            export const EntityGoneEvent: typeof MineflayerEvents.EntityGoneEvent;
            export type ActionBarEvent = MineflayerEvents.ActionBarEvent;
            export const ActionBarEvent: typeof MineflayerEvents.ActionBarEvent;
            export type MessageStrEvent = MineflayerEvents.MessageStrEvent;
            export const MessageStrEvent: typeof MineflayerEvents.MessageStrEvent;
            export type UnmatchedMessageEvent = MineflayerEvents.UnmatchedMessageEvent;
            export const UnmatchedMessageEvent: typeof MineflayerEvents.UnmatchedMessageEvent;
            export type InjectAllowedEvent = MineflayerEvents.InjectAllowedEvent;
            export const InjectAllowedEvent: typeof MineflayerEvents.InjectAllowedEvent;
            export type LoginEvent = MineflayerEvents.LoginEvent;
            export const LoginEvent: typeof MineflayerEvents.LoginEvent;
            export type RespawnEvent = MineflayerEvents.RespawnEvent;
            export const RespawnEvent: typeof MineflayerEvents.RespawnEvent;
            export type GameEvent = MineflayerEvents.GameEvent;
            export const GameEvent: typeof MineflayerEvents.GameEvent;
            export type TitleEvent = MineflayerEvents.TitleEvent;
            export const TitleEvent: typeof MineflayerEvents.TitleEvent;
            export type RainEvent = MineflayerEvents.RainEvent;
            export const RainEvent: typeof MineflayerEvents.RainEvent;
            export type TimeEvent = MineflayerEvents.TimeEvent;
            export const TimeEvent: typeof MineflayerEvents.TimeEvent;
            export type SpawnResetEvent = MineflayerEvents.SpawnResetEvent;
            export const SpawnResetEvent: typeof MineflayerEvents.SpawnResetEvent;
            export type BreathEvent = MineflayerEvents.BreathEvent;
            export const BreathEvent: typeof MineflayerEvents.BreathEvent;
            export type MoveEvent = MineflayerEvents.MoveEvent;
            export const MoveEvent: typeof MineflayerEvents.MoveEvent;
            export type ForcedMoveEvent = MineflayerEvents.ForcedMoveEvent;
            export const ForcedMoveEvent: typeof MineflayerEvents.ForcedMoveEvent;
            export type MountEvent = MineflayerEvents.MountEvent;
            export const MountEvent: typeof MineflayerEvents.MountEvent;
            export type DismountEvent = MineflayerEvents.DismountEvent;
            export const DismountEvent: typeof MineflayerEvents.DismountEvent;
            export type SleepEvent = MineflayerEvents.SleepEvent;
            export const SleepEvent: typeof MineflayerEvents.SleepEvent;
            export type WakeEvent = MineflayerEvents.WakeEvent;
            export const WakeEvent: typeof MineflayerEvents.WakeEvent;
            export type ExperienceEvent = MineflayerEvents.ExperienceEvent;
            export const ExperienceEvent: typeof MineflayerEvents.ExperienceEvent;
            export type UsedFireworkEvent = MineflayerEvents.UsedFireworkEvent;
            export const UsedFireworkEvent: typeof MineflayerEvents.UsedFireworkEvent;
            export type EntitySwingArmEvent = MineflayerEvents.EntitySwingArmEvent;
            export const EntitySwingArmEvent: typeof MineflayerEvents.EntitySwingArmEvent;
            export type EntityHurtEvent = MineflayerEvents.EntityHurtEvent;
            export const EntityHurtEvent: typeof MineflayerEvents.EntityHurtEvent;
            export type EntityDeadEvent = MineflayerEvents.EntityDeadEvent;
            export const EntityDeadEvent: typeof MineflayerEvents.EntityDeadEvent;
            export type EntityTamingEvent = MineflayerEvents.EntityTamingEvent;
            export const EntityTamingEvent: typeof MineflayerEvents.EntityTamingEvent;
            export type EntityTamedEvent = MineflayerEvents.EntityTamedEvent;
            export const EntityTamedEvent: typeof MineflayerEvents.EntityTamedEvent;
            export type EntityShakingOffWaterEvent = MineflayerEvents.EntityShakingOffWaterEvent;
            export const EntityShakingOffWaterEvent: typeof MineflayerEvents.EntityShakingOffWaterEvent;
            export type EntityEatingGrassEvent = MineflayerEvents.EntityEatingGrassEvent;
            export const EntityEatingGrassEvent: typeof MineflayerEvents.EntityEatingGrassEvent;
            export type EntityHandSwapEvent = MineflayerEvents.EntityHandSwapEvent;
            export const EntityHandSwapEvent: typeof MineflayerEvents.EntityHandSwapEvent;
            export type EntityWakeEvent = MineflayerEvents.EntityWakeEvent;
            export const EntityWakeEvent: typeof MineflayerEvents.EntityWakeEvent;
            export type EntityEatEvent = MineflayerEvents.EntityEatEvent;
            export const EntityEatEvent: typeof MineflayerEvents.EntityEatEvent;
            export type EntityCriticalEffectEvent = MineflayerEvents.EntityCriticalEffectEvent;
            export const EntityCriticalEffectEvent: typeof MineflayerEvents.EntityCriticalEffectEvent;
            export type EntityMagicCriticalEffectEvent = MineflayerEvents.EntityMagicCriticalEffectEvent;
            export const EntityMagicCriticalEffectEvent: typeof MineflayerEvents.EntityMagicCriticalEffectEvent;
            export type EntityCrouchEvent = MineflayerEvents.EntityCrouchEvent;
            export const EntityCrouchEvent: typeof MineflayerEvents.EntityCrouchEvent;
            export type EntityUncrouchEvent = MineflayerEvents.EntityUncrouchEvent;
            export const EntityUncrouchEvent: typeof MineflayerEvents.EntityUncrouchEvent;
            export type EntityEquipEvent = MineflayerEvents.EntityEquipEvent;
            export const EntityEquipEvent: typeof MineflayerEvents.EntityEquipEvent;
            export type EntitySleepEvent = MineflayerEvents.EntitySleepEvent;
            export const EntitySleepEvent: typeof MineflayerEvents.EntitySleepEvent;
            export type EntityElytraFlewEvent = MineflayerEvents.EntityElytraFlewEvent;
            export const EntityElytraFlewEvent: typeof MineflayerEvents.EntityElytraFlewEvent;
            export type ItemDropEvent = MineflayerEvents.ItemDropEvent;
            export const ItemDropEvent: typeof MineflayerEvents.ItemDropEvent;
            export type PlayerCollectEvent = MineflayerEvents.PlayerCollectEvent;
            export const PlayerCollectEvent: typeof MineflayerEvents.PlayerCollectEvent;
            export type EntityAttributesEvent = MineflayerEvents.EntityAttributesEvent;
            export const EntityAttributesEvent: typeof MineflayerEvents.EntityAttributesEvent;
            export type EntityMovedEvent = MineflayerEvents.EntityMovedEvent;
            export const EntityMovedEvent: typeof MineflayerEvents.EntityMovedEvent;
            export type EntityDetachEvent = MineflayerEvents.EntityDetachEvent;
            export const EntityDetachEvent: typeof MineflayerEvents.EntityDetachEvent;
            export type EntityAttachEvent = MineflayerEvents.EntityAttachEvent;
            export const EntityAttachEvent: typeof MineflayerEvents.EntityAttachEvent;
            export type EntityUpdateEvent = MineflayerEvents.EntityUpdateEvent;
            export const EntityUpdateEvent: typeof MineflayerEvents.EntityUpdateEvent;
            export type EntityEffectEvent = MineflayerEvents.EntityEffectEvent;
            export const EntityEffectEvent: typeof MineflayerEvents.EntityEffectEvent;
            export type EntityEffectEndEvent = MineflayerEvents.EntityEffectEndEvent;
            export const EntityEffectEndEvent: typeof MineflayerEvents.EntityEffectEndEvent;
            export type PlayerUpdatedEvent = MineflayerEvents.PlayerUpdatedEvent;
            export const PlayerUpdatedEvent: typeof MineflayerEvents.PlayerUpdatedEvent;
            export type BlockUpdateEvent = MineflayerEvents.BlockUpdateEvent;
            export const BlockUpdateEvent: typeof MineflayerEvents.BlockUpdateEvent;
            export type ChunkColumnLoadEvent = MineflayerEvents.ChunkColumnLoadEvent;
            export const ChunkColumnLoadEvent: typeof MineflayerEvents.ChunkColumnLoadEvent;
            export type ChunkColumnUnloadEvent = MineflayerEvents.ChunkColumnUnloadEvent;
            export const ChunkColumnUnloadEvent: typeof MineflayerEvents.ChunkColumnUnloadEvent;
            export type SoundEffectHeardEvent = MineflayerEvents.SoundEffectHeardEvent;
            export const SoundEffectHeardEvent: typeof MineflayerEvents.SoundEffectHeardEvent;
            export type HardcodedSoundEffectHeardEvent = MineflayerEvents.HardcodedSoundEffectHeardEvent;
            export const HardcodedSoundEffectHeardEvent: typeof MineflayerEvents.HardcodedSoundEffectHeardEvent;
            export type NoteHeardEvent = MineflayerEvents.NoteHeardEvent;
            export const NoteHeardEvent: typeof MineflayerEvents.NoteHeardEvent;
            export type PistonMoveEvent = MineflayerEvents.PistonMoveEvent;
            export const PistonMoveEvent: typeof MineflayerEvents.PistonMoveEvent;
            export type ChestLidMoveEvent = MineflayerEvents.ChestLidMoveEvent;
            export const ChestLidMoveEvent: typeof MineflayerEvents.ChestLidMoveEvent;
            export type BlockBreakProgressObservedEvent = MineflayerEvents.BlockBreakProgressObservedEvent;
            export const BlockBreakProgressObservedEvent: typeof MineflayerEvents.BlockBreakProgressObservedEvent;
            export type BlockBreakProgressEndEvent = MineflayerEvents.BlockBreakProgressEndEvent;
            export const BlockBreakProgressEndEvent: typeof MineflayerEvents.BlockBreakProgressEndEvent;
            export type DiggingCompletedEvent = MineflayerEvents.DiggingCompletedEvent;
            export const DiggingCompletedEvent: typeof MineflayerEvents.DiggingCompletedEvent;
            export type DiggingAbortedEvent = MineflayerEvents.DiggingAbortedEvent;
            export const DiggingAbortedEvent: typeof MineflayerEvents.DiggingAbortedEvent;
            export type WindowOpenEvent = MineflayerEvents.WindowOpenEvent;
            export const WindowOpenEvent: typeof MineflayerEvents.WindowOpenEvent;
            export type WindowCloseEvent = MineflayerEvents.WindowCloseEvent;
            export const WindowCloseEvent: typeof MineflayerEvents.WindowCloseEvent;
            export type PhysicsTickEvent = MineflayerEvents.PhysicsTickEvent;
            export const PhysicsTickEvent: typeof MineflayerEvents.PhysicsTickEvent;
            export type ScoreboardCreatedEvent = MineflayerEvents.ScoreboardCreatedEvent;
            export const ScoreboardCreatedEvent: typeof MineflayerEvents.ScoreboardCreatedEvent;
            export type ScoreboardDeletedEvent = MineflayerEvents.ScoreboardDeletedEvent;
            export const ScoreboardDeletedEvent: typeof MineflayerEvents.ScoreboardDeletedEvent;
            export type ScoreboardTitleChangedEvent = MineflayerEvents.ScoreboardTitleChangedEvent;
            export const ScoreboardTitleChangedEvent: typeof MineflayerEvents.ScoreboardTitleChangedEvent;
            export type ScoreUpdatedEvent = MineflayerEvents.ScoreUpdatedEvent;
            export const ScoreUpdatedEvent: typeof MineflayerEvents.ScoreUpdatedEvent;
            export type ScoreRemovedEvent = MineflayerEvents.ScoreRemovedEvent;
            export const ScoreRemovedEvent: typeof MineflayerEvents.ScoreRemovedEvent;
            export type ScoreboardPositionEvent = MineflayerEvents.ScoreboardPositionEvent;
            export const ScoreboardPositionEvent: typeof MineflayerEvents.ScoreboardPositionEvent;
            export type TeamCreatedEvent = MineflayerEvents.TeamCreatedEvent;
            export const TeamCreatedEvent: typeof MineflayerEvents.TeamCreatedEvent;
            export type TeamRemovedEvent = MineflayerEvents.TeamRemovedEvent;
            export const TeamRemovedEvent: typeof MineflayerEvents.TeamRemovedEvent;
            export type TeamUpdatedEvent = MineflayerEvents.TeamUpdatedEvent;
            export const TeamUpdatedEvent: typeof MineflayerEvents.TeamUpdatedEvent;
            export type TeamMemberAddedEvent = MineflayerEvents.TeamMemberAddedEvent;
            export const TeamMemberAddedEvent: typeof MineflayerEvents.TeamMemberAddedEvent;
            export type TeamMemberRemovedEvent = MineflayerEvents.TeamMemberRemovedEvent;
            export const TeamMemberRemovedEvent: typeof MineflayerEvents.TeamMemberRemovedEvent;
            export type BossBarCreatedEvent = MineflayerEvents.BossBarCreatedEvent;
            export const BossBarCreatedEvent: typeof MineflayerEvents.BossBarCreatedEvent;
            export type BossBarDeletedEvent = MineflayerEvents.BossBarDeletedEvent;
            export const BossBarDeletedEvent: typeof MineflayerEvents.BossBarDeletedEvent;
            export type BossBarUpdatedEvent = MineflayerEvents.BossBarUpdatedEvent;
            export const BossBarUpdatedEvent: typeof MineflayerEvents.BossBarUpdatedEvent;
            export type ResourcePackEvent = MineflayerEvents.ResourcePackEvent;
            export const ResourcePackEvent: typeof MineflayerEvents.ResourcePackEvent;
            export type ParticleEvent = MineflayerEvents.ParticleEvent;
            export const ParticleEvent: typeof MineflayerEvents.ParticleEvent;
        }

        export type Listener = import("../event/Listener").Listener;

        export const settings: SettingsApi;
        export const prefix: {
            xady: typeof xady;
            error: typeof error;
            event: typeof event;
            success: typeof success;
            command: typeof command;
            module: typeof module;
        };
    }
}
export { };
