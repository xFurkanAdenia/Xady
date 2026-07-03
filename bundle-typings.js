const fs = require('fs');
const path = require('path');

const mineflayerDtsPath = path.join(__dirname, 'node_modules', 'mineflayer', 'index.d.ts');
const xadyDtsPath = path.join(__dirname, 'typings', 'xady.d.ts');

let mineflayerContent = fs.readFileSync(mineflayerDtsPath, 'utf-8');
let xadyContent = fs.readFileSync(xadyDtsPath, 'utf-8');

// Strip all imports from mineflayer
mineflayerContent = mineflayerContent.replace(/^import\s+.*$/gm, '');

// Convert export declarations to just exports (wait, inside declare module, export function is fine)
// Wrap in declare module 'mineflayer'
const mineflayerModule = `
declare module 'mineflayer' {
${mineflayerContent}
}
`;

const mockModules = `
declare module 'minecraft-protocol' {
  export type Client = any;
  export type ClientOptions = any;
}
declare module 'vec3' {
  export type Vec3 = any;
  export function vec3(x: number, y: number, z: number): Vec3;
}
declare module 'prismarine-item' {
  export type Item = any;
}
declare module 'prismarine-windows' {
  export type Window = any;
}
declare module 'prismarine-recipe' {
  export type Recipe = any;
}
declare module 'prismarine-block' {
  export type Block = any;
}
declare module 'prismarine-entity' {
  export type Entity = any;
}
declare module 'prismarine-chat' {
  export type ChatMessage = any;
}
declare module 'prismarine-world' {
  export type world = any;
}
declare module 'prismarine-registry' {
  export type Registry = any;
}
declare module 'minecraft-data' {
  export type IndexedData = any;
}
declare module 'typed-emitter' {
  import { EventEmitter } from 'events';
  export default interface TypedEmitter<Events extends Record<string | symbol, any>> extends EventEmitter {
    on<E extends keyof Events>(event: E, listener: Events[E]): this;
    once<E extends keyof Events>(event: E, listener: Events[E]): this;
    emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E] extends (...args: any[]) => any ? Events[E] : never>): boolean;
  }
}
`;

// Append mock modules and mineflayer module to xady.d.ts
const finalContent = xadyContent + "\n" + mockModules + "\n" + mineflayerModule;

fs.writeFileSync(xadyDtsPath, finalContent, 'utf-8');
console.log('Successfully bundled mineflayer types into xady.d.ts!');
