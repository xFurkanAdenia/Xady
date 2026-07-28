/**
 * Comprehensive type declarations for prismarine ecosystem
 * Covers prismarine-block, prismarine-entity, prismarine-item, prismarine-world, etc.
 */

declare module 'prismarine-block' {
    import { Vec3 } from 'vec3';
    
    class Block {
        readonly type: number;
        readonly name: string;
        readonly displayName: string;
        readonly hardness: number;
        readonly minStateId: number;
        readonly maxStateId: number;
        readonly stateId: number;
        readonly states: Record<string, unknown>;
        readonly position: Vec3;
        readonly biome: { readonly id: number; readonly name: string };
        readonly skyLight: number;
        readonly blockLight: number;
        readonly boundingBox: 'block' | 'empty';
        readonly diggable: boolean;
        readonly material?: string;
        readonly harvestTools?: Record<number, boolean>;
        readonly drops?: number[];
        readonly transparent: boolean;
        readonly emitLight: number;
        readonly filterLight: number;
        
        canHarvest(heldItemType: number | null): boolean;
        digTime(heldItemType: number | null, creative?: boolean, inWater?: boolean, notOnGround?: boolean, enchantments?: unknown[]): number;
    }
    
    export = Block;
}

declare module 'prismarine-item' {
    class Item {
        readonly type: number;
        readonly name: string;
        readonly displayName: string;
        readonly stackSize: number;
        count: number;
        metadata: number;
        nbt: unknown | null;
        
        readonly enchants: Array<{ name: string; lvl: number }>;
        readonly repairCost: number;
        readonly customName: string | null;
        readonly customLore: string[] | null;
        
        constructor(type: number, count?: number, metadata?: number, nbt?: unknown);
        
        clone(): Item;
    }
    
    export = Item;
}

declare module 'prismarine-entity' {
    import { Vec3 } from 'vec3';
    import Item from 'prismarine-item';
    
    class Entity {
        readonly id: number;
        readonly type: 'player' | 'mob' | 'object' | 'global' | 'other';
        readonly name: string;
        readonly displayName: string;
        readonly username?: string;
        readonly uuid?: string;
        
        position: Vec3;
        readonly velocity: Vec3;
        yaw: number;
        pitch: number;
        readonly headYaw?: number;
        readonly height: number;
        readonly width: number;
        
        readonly onGround: boolean;
        readonly metadata: unknown[];
        readonly equipment: (Item | null)[];
        readonly heldItem: Item | null;
        
        readonly health?: number;
        readonly food?: number;
        
        readonly isValid: boolean;
        
        setEquipment(slot: number, item: Item | null): void;
    }
    
    export = Entity;
}

declare module 'prismarine-world' {
    import { Vec3 } from 'vec3';
    import Block from 'prismarine-block';
    
    class World {
        getBlock(pos: Vec3): Block | null;
        getBlockType(pos: Vec3): number;
        getBlockData(pos: Vec3): number;
        getBlockLight(pos: Vec3): number;
        getSkyLight(pos: Vec3): number;
        getBiome(pos: Vec3): number;
        
        setBlockType(pos: Vec3, blockType: number): void;
        setBlockData(pos: Vec3, data: number): void;
        setBlockLight(pos: Vec3, light: number): void;
        setSkyLight(pos: Vec3, light: number): void;
        setBiome(pos: Vec3, biome: number): void;
        
        getColumns(): Map<string, unknown>;
        getColumn(chunkX: number, chunkZ: number): unknown | null;
        
        sync: {
            getBlock(pos: Vec3): Block | null;
            setBlock(pos: Vec3, block: Block): void;
        };
    }
    
    function createWorld(generator?: (chunkX: number, chunkZ: number) => unknown): World;
    
    export = createWorld;
}

declare module 'vec3' {
    export class Vec3 {
        x: number;
        y: number;
        z: number;
        
        constructor(x: number, y: number, z: number);
        
        set(x: number, y: number, z: number): this;
        update(other: Vec3): this;
        clone(): Vec3;
        add(other: Vec3): Vec3;
        subtract(other: Vec3): Vec3;
        multiply(scalar: number): Vec3;
        divide(scalar: number): Vec3;
        floor(): Vec3;
        ceil(): Vec3;
        round(): Vec3;
        abs(): Vec3;
        
        distanceTo(other: Vec3): number;
        distanceSquared(other: Vec3): number;
        manhattanDistanceTo(other: Vec3): number;
        
        equals(other: Vec3): boolean;
        
        toString(): string;
        toArray(): [number, number, number];
        
        offset(dx: number, dy: number, dz: number): Vec3;
        
        translate(dx: number, dy: number, dz: number): this;
        
        dot(other: Vec3): number;
        cross(other: Vec3): Vec3;
        
        unit(): Vec3;
        norm(): number;
        normed(): Vec3;
        
        scaled(scalar: number): Vec3;
        
        plus(other: Vec3): Vec3;
        minus(other: Vec3): Vec3;
        
        min(other: Vec3): Vec3;
        max(other: Vec3): Vec3;
        
        static readonly ZERO: Vec3;
        static readonly ONE: Vec3;
    }
    
    export default Vec3;
}

declare module 'prismarine-windows' {
    import Item from 'prismarine-item';
    
    interface Window {
        readonly id: number;
        readonly type: string;
        readonly title: string;
        readonly slots: (Item | null)[];
        readonly inventoryStart: number;
        readonly inventoryEnd: number;
        readonly hotbarStart: number;
        readonly craftingResultSlot: number;
        readonly requiresConfirmation: boolean;
        
        readonly selectedItem: Item | null;
        
        containerCount(): number;
        
        count(itemType: number, metadata?: number | null): number;
        items(): Item[];
        
        emptySlotCount(): number;
        
        transactionRequiresConfirmation(click: unknown): boolean;
        
        findItemRange(start: number, end: number, itemType: number, metadata?: number | null, notFull?: boolean): Item | null;
        findInventoryItem(itemType: number, metadata?: number | null, notFull?: boolean): Item | null;
        findContainerItem(itemType: number, metadata?: number | null, notFull?: boolean): Item | null;
    }
    
    export = Window;
}

declare module 'minecraft-data' {
    interface MinecraftData {
        readonly version: {
            readonly minecraftVersion: string;
            readonly majorVersion: string;
            readonly version: number;
            readonly type: 'pc' | 'bedrock';
        };
        readonly blocks: Record<string, unknown>;
        readonly items: Record<string, unknown>;
        readonly biomes: Record<string, unknown>;
        readonly entities: Record<string, unknown>;
        readonly enchantments: Record<string, unknown>;
        readonly recipes: Record<string, unknown>;
        readonly instruments: Record<string, unknown>;
        readonly foods: Record<string, unknown>;
        readonly effects: Record<string, unknown>;
        readonly particles: Record<string, unknown>;
        readonly protocol: Record<string, unknown>;
        readonly windows: Record<string, unknown>;
        
        readonly blocksByName: Record<string, unknown>;
        readonly itemsByName: Record<string, unknown>;
        readonly biomesByName: Record<string, unknown>;
        readonly entitiesByName: Record<string, unknown>;
        readonly enchantmentsByName: Record<string, unknown>;
        readonly effectsByName: Record<string, unknown>;
        
        readonly blocksArray: unknown[];
        readonly itemsArray: unknown[];
        readonly biomesArray: unknown[];
        readonly entitiesArray: unknown[];
        readonly enchantmentsArray: unknown[];
        readonly effectsArray: unknown[];
    }
    
    function minecraftData(mcVersion: string): MinecraftData;
    
    export = minecraftData;
}

declare module 'minecraft-protocol' {
    import { EventEmitter } from 'events';
    
    interface Client extends EventEmitter {
        write(name: string, params: unknown): void;
        end(reason?: string): void;
        
        readonly state: 'handshaking' | 'status' | 'login' | 'play';
        readonly isServer: boolean;
        readonly latency: number;
        readonly protocolVersion: number;
        readonly socket: unknown;
    }
    
    interface ServerOptions {
        'online-mode'?: boolean;
        port?: number;
        host?: string;
        version?: string;
        maxPlayers?: number;
        motd?: string;
        beforePing?: (response: unknown, client: Client) => unknown;
    }
    
    interface ClientOptions {
        username: string;
        host?: string;
        port?: number;
        version?: string;
        auth?: 'mojang' | 'microsoft' | 'offline';
        password?: string;
        session?: unknown;
        skipValidation?: boolean;
        hideErrors?: boolean;
    }
    
    function createClient(options: ClientOptions): Client;
    function createServer(options?: ServerOptions): EventEmitter;
    
    export { createClient, createServer, Client, ClientOptions, ServerOptions };
}
