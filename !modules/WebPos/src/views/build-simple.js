#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, 'pos-simple.css'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'pos-simple.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, 'pos-simple.html'), 'utf8');

const compiled = html
    .replace('<script src="pos-simple.js"></script>', `<script>${js}</script>`)
    .replace('</head>', `<style>${css}</style></head>`);

fs.writeFileSync(path.join(__dirname, 'pos-simple-compiled.html'), compiled, 'utf8');
console.log('✓ POS Simple view compiled successfully');
