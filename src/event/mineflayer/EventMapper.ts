// Event mapping - mineflayer event adından Xady event class'ına
import * as Events from './EventRegistry';
import { XadyEvent } from '../XadyEvent';

type EventConstructor = new (...args: any[]) => XadyEvent;

interface EventMapping {
    EventClass: EventConstructor;
    argsMapper: (...args: unknown[]) => unknown[];
}

export const EVENT_MAP: Record<string, EventMapping> = {
    'chat': {
        EventClass: Events.PlayerChatEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'whisper': {
        EventClass: Events.WhisperEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'message': {
        EventClass: Events.MessageEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'actionBar': {
        EventClass: Events.ActionBarEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'messagestr': {
        EventClass: Events.MessageStrEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'unmatchedMessage': {
        EventClass: Events.UnmatchedMessageEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'inject_allowed': {
        EventClass: Events.InjectAllowedEvent,
        argsMapper: () => []
    },
    'login': {
        EventClass: Events.LoginEvent as any,
        argsMapper: () => []
    },
    'spawn': {
        EventClass: Events.SpawnEvent as any,
        argsMapper: () => []
    },
    'respawn': {
        EventClass: Events.RespawnEvent as any,
        argsMapper: () => []
    },
    'game': {
        EventClass: Events.GameEvent as any,
        argsMapper: () => []
    },
    'title': {
        EventClass: Events.TitleEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'rain': {
        EventClass: Events.RainEvent as any,
        argsMapper: () => []
    },
    'time': {
        EventClass: Events.TimeEvent as any,
        argsMapper: () => []
    },
    'kicked': {
        EventClass: Events.KickedEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'end': {
        EventClass: Events.EndEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'spawnReset': {
        EventClass: Events.SpawnResetEvent as any,
        argsMapper: () => []
    },
    'death': {
        EventClass: Events.DeathEvent as any,
        argsMapper: () => []
    },
    'health': {
        EventClass: Events.HealthEvent as any,
        argsMapper: () => []
    },
    'breath': {
        EventClass: Events.BreathEvent as any,
        argsMapper: () => []
    },
    'entitySwingArm': {
        EventClass: Events.EntitySwingArmEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityHurt': {
        EventClass: Events.EntityHurtEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'entityDead': {
        EventClass: Events.EntityDeadEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityTaming': {
        EventClass: Events.EntityTamingEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityTamed': {
        EventClass: Events.EntityTamedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityShakingOffWater': {
        EventClass: Events.EntityShakingOffWaterEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityEatingGrass': {
        EventClass: Events.EntityEatingGrassEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityHandSwap': {
        EventClass: Events.EntityHandSwapEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityWake': {
        EventClass: Events.EntityWakeEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityEat': {
        EventClass: Events.EntityEatEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityCriticalEffect': {
        EventClass: Events.EntityCriticalEffectEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityMagicCriticalEffect': {
        EventClass: Events.EntityMagicCriticalEffectEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityCrouch': {
        EventClass: Events.EntityCrouchEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityUncrouch': {
        EventClass: Events.EntityUncrouchEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityEquip': {
        EventClass: Events.EntityEquipEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entitySleep': {
        EventClass: Events.EntitySleepEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entitySpawn': {
        EventClass: Events.EntitySpawnEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityElytraFlew': {
        EventClass: Events.EntityElytraFlewEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'usedFirework': {
        EventClass: Events.UsedFireworkEvent as any,
        argsMapper: () => []
    },
    'itemDrop': {
        EventClass: Events.ItemDropEvent,
        argsMapper: (...args) => [args[0]]
    },
    'playerCollect': {
        EventClass: Events.PlayerCollectEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'entityAttributes': {
        EventClass: Events.EntityAttributesEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityGone': {
        EventClass: Events.EntityGoneEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityMoved': {
        EventClass: Events.EntityMovedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityDetach': {
        EventClass: Events.EntityDetachEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'entityAttach': {
        EventClass: Events.EntityAttachEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'entityUpdate': {
        EventClass: Events.EntityUpdateEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'entityEffect': {
        EventClass: Events.EntityEffectEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'entityEffectEnd': {
        EventClass: Events.EntityEffectEndEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'playerJoined': {
        EventClass: Events.PlayerJoinEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'playerUpdated': {
        EventClass: Events.PlayerUpdatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'playerLeft': {
        EventClass: Events.PlayerLeftEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'blockUpdate': {
        EventClass: Events.BlockUpdateEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'chunkColumnLoad': {
        EventClass: Events.ChunkColumnLoadEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'chunkColumnUnload': {
        EventClass: Events.ChunkColumnUnloadEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'soundEffectHeard': {
        EventClass: Events.SoundEffectHeardEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2], args[3]]
    },
    'hardcodedSoundEffectHeard': {
        EventClass: Events.HardcodedSoundEffectHeardEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2], args[3], args[4]]
    },
    'noteHeard': {
        EventClass: Events.NoteHeardEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'pistonMove': {
        EventClass: Events.PistonMoveEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'chestLidMove': {
        EventClass: Events.ChestLidMoveEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'blockBreakProgressObserved': {
        EventClass: Events.BlockBreakProgressObservedEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'blockBreakProgressEnd': {
        EventClass: Events.BlockBreakProgressEndEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'diggingCompleted': {
        EventClass: Events.DiggingCompletedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'diggingAborted': {
        EventClass: Events.DiggingAbortedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'move': {
        EventClass: Events.MoveEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'forcedMove': {
        EventClass: Events.ForcedMoveEvent as any,
        argsMapper: () => []
    },
    'mount': {
        EventClass: Events.MountEvent as any,
        argsMapper: () => []
    },
    'dismount': {
        EventClass: Events.DismountEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'windowOpen': {
        EventClass: Events.WindowOpenEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'windowClose': {
        EventClass: Events.WindowCloseEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'sleep': {
        EventClass: Events.SleepEvent as any,
        argsMapper: () => []
    },
    'wake': {
        EventClass: Events.WakeEvent as any,
        argsMapper: () => []
    },
    'experience': {
        EventClass: Events.ExperienceEvent as any,
        argsMapper: () => []
    },
    'physicsTick': {
        EventClass: Events.PhysicsTickEvent as any,
        argsMapper: () => []
    },
    'scoreboardCreated': {
        EventClass: Events.ScoreboardCreatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'scoreboardDeleted': {
        EventClass: Events.ScoreboardDeletedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'scoreboardTitleChanged': {
        EventClass: Events.ScoreboardTitleChangedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'scoreUpdated': {
        EventClass: Events.ScoreUpdatedEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'scoreRemoved': {
        EventClass: Events.ScoreRemovedEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'scoreboardPosition': {
        EventClass: Events.ScoreboardPositionEvent as any,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'teamCreated': {
        EventClass: Events.TeamCreatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'teamRemoved': {
        EventClass: Events.TeamRemovedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'teamUpdated': {
        EventClass: Events.TeamUpdatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'teamMemberAdded': {
        EventClass: Events.TeamMemberAddedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'teamMemberRemoved': {
        EventClass: Events.TeamMemberRemovedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'bossBarCreated': {
        EventClass: Events.BossBarCreatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'bossBarDeleted': {
        EventClass: Events.BossBarDeletedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'bossBarUpdated': {
        EventClass: Events.BossBarUpdatedEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'resourcePack': {
        EventClass: Events.ResourcePackEvent as any,
        argsMapper: (...args) => [args[0], args[1], args[2]]
    },
    'particle': {
        EventClass: Events.ParticleEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'error': {
        EventClass: Events.ErrorEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    'clientChatTypeEvent': {
        EventClass: Events.ClientChatTypeEvent as any,
        argsMapper: (...args) => [args[0]]
    },
    // Pathfinder events
    'goal_reached': {
        EventClass: Events.GoalReachedEvent,
        argsMapper: (...args) => [args[0]]
    },
    'path_update': {
        EventClass: Events.PathUpdateEvent,
        argsMapper: (...args) => [args[0]]
    },
    'goal_updated': {
        EventClass: Events.GoalUpdatedEvent,
        argsMapper: (...args) => [args[0], args[1]]
    },
    'path_reset': {
        EventClass: Events.PathResetEvent,
        argsMapper: (...args) => [args[0]]
    },
    'path_stop': {
        EventClass: Events.PathStopEvent,
        argsMapper: () => []
    }
};
