import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockPath = path.resolve(__dirname, "scripts/mock-types.d.ts");

export default {
    input: "./src/types/index.ts",
    output: {
        file: "./typings/xady.d.ts",
        format: "es"
    },
    external: [
        'events', 'stream', 'net', 'tls', 'crypto', 'buffer', 'util', 'fs', 'path', 'os', 'child_process', 'http', 'https', 'url', 'zlib', 'dns', 'dgram', 'perf_hooks', 'worker_threads', 'assert', 'string_decoder', 'readline', 'tty', 'vm', 'module', 'v8', 'inspector', 'async_hooks', 'trace_events', 'wasi', 'diagnostics_channel', 'fs/promises', 'stream/promises', 'stream/consumers', 'stream/web', 'timers/promises', 'util/types', 'constants', 'timers'
    ],
    plugins: [
        alias({
            entries: [
                { find: 'minecraft-protocol', replacement: mockPath },
                { find: 'mineflayer', replacement: path.resolve(__dirname, 'node_modules/mineflayer/index.d.ts') },
                { find: 'vec3', replacement: mockPath },
                { find: 'prismarine-item', replacement: mockPath },
                { find: 'prismarine-windows', replacement: mockPath },
                { find: 'prismarine-recipe', replacement: mockPath },
                { find: 'prismarine-block', replacement: mockPath },
                { find: 'prismarine-entity', replacement: mockPath },
                { find: 'prismarine-chat', replacement: mockPath },
                { find: 'prismarine-world', replacement: mockPath },
                { find: 'prismarine-registry', replacement: mockPath },
                { find: 'minecraft-data', replacement: mockPath },
                { find: 'typed-emitter', replacement: mockPath }
            ]
        }),
        resolve({
            browser: false,
            preferBuiltins: true,
            extensions: ['.ts', '.d.ts', '.js']
        }),
        dts({ 
            respectExternal: false,
            compilerOptions: {
                preserveSymlinks: false
            }
        })
    ],
};