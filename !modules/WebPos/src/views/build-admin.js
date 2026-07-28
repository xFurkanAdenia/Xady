const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'admin.html');
const cssPath = path.join(__dirname, 'admin.css');
const jsPath = path.join(__dirname, 'admin.js');
const outputPath = path.join(__dirname, 'admin-compiled.html');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

const compiled = html
    .replace('<link rel="stylesheet" href="admin.css">', `<style>${css}</style>`)
    .replace('<script src="admin.js"></script>', `<script>${js}</script>`);

fs.writeFileSync(outputPath, compiled, 'utf8');
console.log('[Build] admin-compiled.html oluşturuldu.');
