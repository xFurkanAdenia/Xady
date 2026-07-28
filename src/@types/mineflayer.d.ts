/**
 * Type augmentations for mineflayer
 * Extends existing types with missing properties and custom methods
 */

import { Bot as MineflayerBot } from 'mineflayer';
import { Pathfinder } from 'mineflayer-pathfinder';

declare module 'mineflayer' {
    interface Bot {
        // Internal methods added by Xady for chat pattern management
        _internalAddChatPattern?: (name: string, pattern: RegExp, options: { parse: boolean; repeat: boolean }) => void;
        _internalAddChatPatternSet?: (name: string, patterns: RegExp[], options: { parse: boolean; repeat: boolean }) => void;
        _internalRemoveChatPattern?: (name: string) => void;
        
        // Plugin detection
        hasPlugin?: (plugin: unknown) => boolean;
        
        // Pathfinder plugin
        pathfinder: Pathfinder;
        
        // Additional mineflayer properties that may be missing
        readonly majorVersion: string;
        readonly supportFeature: (feature: string) => boolean;
        
        // Client properties
        readonly protocolVersion: number;
        readonly version: string;
    }
    
    interface BotOptions {
        // Additional options
        hideErrors?: boolean;
        keepAlive?: boolean;
        checkTimeoutInterval?: number;
        noPongTimeout?: number;
        closeTimeout?: number;
        respawn?: boolean;
        viewDistance?: 'tiny' | 'short' | 'medium' | 'far' | 'veryfar';
        difficulty?: 0 | 1 | 2 | 3;
        showCape?: boolean;
    }
}

declare module 'mineflayer-pathfinder' {
    import { Bot } from 'mineflayer';
    import { Vec3 } from 'vec3';
    import { Block } from 'prismarine-block';
    import { Entity } from 'prismarine-entity';
    
    export interface Pathfinder {
        thinkTimeout: number;
        tickTimeout: number;
        searchRadius: number;
        
        readonly goal: goals.Goal | null;
        readonly movements: Movements;
        
        setGoal(goal: goals.Goal | null, dynamic?: boolean): void;
        setMovements(movements: Movements): void;
        goto(goal: goals.Goal): Promise<void>;
        stop(): void;
        
        isMoving(): boolean;
        isMining(): boolean;
        isBuilding(): boolean;
        
        bestHarvestTool(block: Block): { item: unknown; digTime: number; damage: number } | null;
        getPathTo(movements: Movements, goal: goals.Goal, timeout?: number): ComputedPath;
        getPathFromTo(
            movements: Movements,
            startPos: Vec3,
            goal: goals.Goal,
            options?: PathOptions
        ): IterableIterator<{ result: ComputedPath; astarContext: unknown }>;
    }
    
    export interface PathOptions {
        optimizePath?: boolean;
        resetEntityIntersects?: boolean;
        timeout?: number;
        tickTimeout?: number;
        searchRadius?: number;
        startMove?: Move;
    }
    
    export interface ComputedPath {
        status: 'success' | 'timeout' | 'noPath';
        cost: number;
        time: number;
        visitedNodes: number;
        generatedNodes: number;
        path: Move[];
    }
    
    export interface PartiallyComputedPath extends ComputedPath {
        status: 'success' | 'partial' | 'timeout' | 'noPath';
    }
    
    export interface Move {
        x: number;
        y: number;
        z: number;
        remainingBlocks: number;
        cost: number;
        toBreak: Move[];
        toPlace: Move[];
        parkour: boolean;
        hash: string;
    }
    
    export class Movements {
        constructor(bot: Bot, mcData?: unknown);
        
        canDig: boolean;
        digCost: number;
        placeCost: number;
        liquidCost: number;
        entityCost: number;
        
        dontCreateFlow: boolean;
        dontMineUnderFallingBlock: boolean;
        infiniteLiquidDropdownDistance: boolean;
        
        allow1by1towers: boolean;
        allowFreeMotion: boolean;
        allowParkour: boolean;
        allowSprinting: boolean;
        allowEntityDetection: boolean;
        canOpenDoors: boolean;
        
        maxDropDown: number;
        
        entitiesToAvoid: Set<string>;
        passableEntities: Set<string>;
        interactableBlocks: Set<string>;
        blocksCantBreak: Set<number>;
        blocksToAvoid: Set<number>;
        liquids: Set<number>;
        climbables: Set<number>;
        replaceables: Set<number>;
        fences: Set<number>;
        carpets: Set<number>;
        gravityBlocks: Set<number>;
        
        scafoldingBlocks: number[];
        
        exclusionAreasStep: Array<(block: Block) => number>;
        exclusionAreasBreak: Array<(block: Block) => number>;
        exclusionAreasPlace: Array<(block: Block) => number>;
        
        entityIntersections: Record<string, number>;
    }
    
    export interface Move {
        x: number;
        y: number;
        z: number;
        dx?: number;
        dy?: number;
        dz?: number;
        cost?: number;
        remainingBlocks?: number;
    }
    
    export namespace goals {
        export abstract class Goal {
            abstract heuristic(node: Move): number;
            abstract isEnd(node: Move): boolean;
            hasChanged(): boolean;
            isValid(): boolean;
        }
        
        export class GoalBlock extends Goal {
            constructor(x: number, y: number, z: number);
            x: number;
            y: number;
            z: number;
        }
        
        export class GoalNear extends Goal {
            constructor(x: number, y: number, z: number, range: number);
            x: number;
            y: number;
            z: number;
            rangeSq: number;
        }
        
        export class GoalXZ extends Goal {
            constructor(x: number, z: number);
            x: number;
            z: number;
        }
        
        export class GoalNearXZ extends Goal {
            constructor(x: number, z: number, range: number);
            x: number;
            z: number;
            rangeSq: number;
        }
        
        export class GoalY extends Goal {
            constructor(y: number);
            y: number;
        }
        
        export class GoalGetToBlock extends Goal {
            constructor(x: number, y: number, z: number);
            x: number;
            y: number;
            z: number;
        }
        
        export class GoalFollow extends Goal {
            constructor(entity: Entity, range: number);
            entity: Entity;
            rangeSq: number;
            x: number;
            y: number;
            z: number;
        }
        
        export class GoalPlaceBlock extends Goal {
            constructor(pos: Vec3, world: unknown, options: PlaceBlockOptions);
            options: PlaceBlockOptions;
        }
        
        export class GoalLookAtBlock extends Goal {
            constructor(pos: Vec3, world: unknown, options?: LookAtBlockOptions);
            pos: Vec3;
            reach: number;
            entityHeight: number;
        }
        
        export class GoalBreakBlock extends GoalLookAtBlock {}
        
        export class GoalCompositeAny extends Goal {
            constructor(goals: Goal[]);
            goals: Goal[];
            push(goal: Goal): void;
        }
        
        export class GoalCompositeAll extends Goal {
            constructor(goals: Goal[]);
            goals: Goal[];
            push(goal: Goal): void;
        }
        
        export class GoalInvert extends Goal {
            constructor(goal: Goal);
            goal: Goal;
        }
    }
    
    export interface PlaceBlockOptions {
        range?: number;
        LOS?: boolean;
        faces?: Vec3[];
        facing?: 'north' | 'east' | 'south' | 'west' | 'up' | 'down';
        half?: 'top' | 'bottom';
    }
    
    export interface LookAtBlockOptions {
        reach?: number;
        entityHeight?: number;
    }
    
    export function pathfinder(bot: Bot): void;
}
