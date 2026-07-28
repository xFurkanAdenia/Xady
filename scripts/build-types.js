const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building types using dts-bundle-generator...');
try {
    execSync('npx dts-bundle-generator -o typings/xady.d.ts src/types/index.ts --no-check --inline-declare-global --external-inlines mineflayer mineflayer-pathfinder', { stdio: 'inherit' });
} catch (e) {
    console.error('Failed to run dts-bundle-generator');
    process.exit(1);
}

console.log('Cleaning up generated types...');
const typingsPath = path.join(__dirname, '../typings/xady.d.ts');
let content = fs.readFileSync(typingsPath, 'utf8');

// Remove duplicate EventEmitter import from stream
content = content.replace("import { EventEmitter as EventEmitter$1 } from 'stream';\n", "");
content = content.replace("import { EventEmitter as EventEmitter$1 } from 'stream';\r\n", "");
content = content.replace(/import EventEmitter\$2 from 'stream';/g, "import { EventEmitter as EventEmitter$2 } from 'stream';");

// Fix duplicate 'Bot' export conflict
content = content.replace(/export interface Bot extends TypedEmitter<BotEvents>/g, 'interface Bot extends TypedEmitter<BotEvents>');

// Remove private identifiers to avoid TS target errors
content = content.replace(/^\s*#private;\n/gm, '');

// Fix circular references in Xady namespace
content = content.replace(/type (\w+) = \1;/g, 'type $1 = any; /* Circular reference fixed */');
content = content.replace(/const (\w+): typeof \1;/g, 'const $1: any; /* Circular reference fixed */');

fs.writeFileSync(typingsPath, content);
console.log('Successfully generated standalone xady.d.ts with inline Mineflayer typings!');
