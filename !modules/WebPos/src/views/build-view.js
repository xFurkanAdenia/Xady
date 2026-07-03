// Build script to combine HTML, CSS, JS into single file
const fs = require('fs');
const path = require('path');

const viewsDir = __dirname;

const css = fs.readFileSync(path.join(viewsDir, 'pos.css'), 'utf8');
const js = fs.readFileSync(path.join(viewsDir, 'pos.js'), 'utf8');
const html = fs.readFileSync(path.join(viewsDir, 'pos.html'), 'utf8');

// Inject CSS and JS into HTML
const output = html
    .replace('<title>POS Terminal</title>', `
        <title>POS Terminal</title>
        <style>${css}</style>
    `)
    .replace('<script src="pos.js"></script>', `
        <script>${js}</script>
    `);

// Write to output file
fs.writeFileSync(path.join(viewsDir, 'pos-compiled.html'), output, 'utf8');

console.log('✓ POS view compiled successfully');
