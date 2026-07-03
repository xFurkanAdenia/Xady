#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'pos-device.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'pos-device.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'pos-device.html'), 'utf8');

const compiled = html
    .replace('<script src="pos-device.js"></script>', `<script>${js}</script>`)
    .replace('</head>', `<style>${css}</style></head>`);

fs.writeFileSync(path.join(__dirname, 'pos-device-compiled.html'), compiled, 'utf8');
console.log('✓ POS Device view compiled successfully');
