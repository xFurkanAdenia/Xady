/**
 * Type declarations for prismarine-registry
 * Provides access to Minecraft protocol data
 */

declare module 'prismarine-registry' {
    interface Registry {
        readonly version: {
            readonly minecraftVersion: string;
            readonly majorVersion: string;
            readonly version: number;
            readonly type: 'pc' | 'bedrock';
        };
        readonly blocks: BlockRegistry;
        readonly items: ItemRegistry;
        readonly biomes: BiomeRegistry;
        readonly entities: EntityRegistry;
        readonly enchantments: EnchantmentRegistry;
        readonly protocol: ProtocolRegistry;
        readonly effects: EffectRegistry;
        readonly particles: ParticleRegistry;
        readonly recipes: RecipeRegistry;
        readonly instruments: InstrumentRegistry;
        readonly foods: FoodRegistry;
        readonly blocksByName: Record<string, Block>;
        readonly itemsByName: Record<string, Item>;
        readonly blocksByStateId: Map<number, Block>;
        readonly itemsArray: Item[];
        readonly blocksArray: Block[];
    }

    interface Block {
        readonly id: number;
        readonly name: string;
        readonly displayName: string;
        readonly hardness: number;
        readonly diggable: boolean;
        readonly boundingBox: 'block' | 'empty';
        readonly stackSize: number;
        readonly material?: string;
        readonly harvestTools?: Record<number, boolean>;
        readonly drops?: number[];
        readonly transparent: boolean;
        readonly emitLight: number;
        readonly filterLight: number;
        readonly minStateId: number;
        readonly maxStateId: number;
        readonly states: BlockState[];
        readonly defaultState: number;
    }

    interface BlockState {
        readonly name: string;
        readonly type: string;
        readonly num_values: number;
        readonly values?: string[];
    }

    interface Item {
        readonly id: number;
        readonly name: string;
        readonly displayName: string;
        readonly stackSize: number;
        readonly enchantCategories?: string[];
        readonly maxDurability?: number;
    }

    interface ItemRegistry {
        [id: number]: Item;
    }

    interface BlockRegistry {
        [id: number]: Block;
    }

    interface BiomeRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly category: string;
            readonly temperature: number;
            readonly precipitation: string;
            readonly depth?: number;
            readonly dimension?: string;
            readonly displayName: string;
            readonly color: number;
            readonly rainfall: number;
        };
    }

    interface EntityRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly displayName: string;
            readonly width: number;
            readonly height: number;
            readonly type: string;
            readonly category: string;
        };
    }

    interface EnchantmentRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly displayName: string;
            readonly maxLevel: number;
            readonly exclude?: string[];
        };
    }

    interface ProtocolRegistry {
        readonly types: Record<string, unknown>;
    }

    interface EffectRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly displayName: string;
            readonly type: 'good' | 'bad';
        };
    }

    interface ParticleRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly displayName: string;
        };
    }

    interface RecipeRegistry {
        [id: number]: unknown;
    }

    interface InstrumentRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
        };
    }

    interface FoodRegistry {
        [id: number]: {
            readonly id: number;
            readonly name: string;
            readonly foodPoints: number;
            readonly saturation: number;
        };
    }

    function registry(mcVersion: string): Registry;
    
    export = registry;
}
