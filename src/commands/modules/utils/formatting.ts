/**
 * Output formatting utilities
 */

import chalk from "chalk";

export function formatHeader(text: string): string {
    return chalk.cyanBright.bold(`━━━ ${text} ━━━`);
}

export function formatSection(title: string): string {
    return chalk.yellowBright.bold(`▶ ${title}`);
}

export function formatKey(key: string): string {
    return chalk.gray(`${key}:`);
}

export function formatValue(value: string | number | boolean | readonly string[]): string {
    if (typeof value === 'boolean') {
        return value ? chalk.green('Yes') : chalk.red('No');
    }
    if (typeof value === 'number') {
        return chalk.white(value.toString());
    }
    if (Array.isArray(value)) {
        return chalk.white(value.join(', '));
    }
    return chalk.white(String(value));
}

export function formatKeyValue(key: string, value: string | number | boolean | readonly string[], indent: number = 0): string {
    const padding = '  '.repeat(indent);
    return `${padding}${formatKey(key)} ${formatValue(value)}`;
}

export function formatList(items: readonly string[], bullet: string = '•', indent: number = 0): readonly string[] {
    const padding = '  '.repeat(indent);
    return items.map(item => `${padding}${chalk.gray(bullet)} ${item}`);
}

export function formatTable(headers: readonly string[], rows: readonly (readonly string[])[]): readonly string[] {
    if (rows.length === 0) return [];
    
    // Calculate column widths
    const colWidths = headers.map((h, i) => {
        const maxDataWidth = Math.max(...rows.map(r => (r[i] || '').length));
        return Math.max(h.length, maxDataWidth);
    });
    
    const lines: string[] = [];
    
    // Header
    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(' │ ');
    lines.push(chalk.bold(headerLine));
    lines.push(colWidths.map(w => '─'.repeat(w)).join('─┼─'));
    
    // Rows
    for (const row of rows) {
        const rowLine = row.map((cell, i) => (cell || '').padEnd(colWidths[i])).join(' │ ');
        lines.push(rowLine);
    }
    
    return lines;
}

export function formatPercentage(value: number, total: number): string {
    if (total === 0) return chalk.gray('0%');
    const percent = (value / total) * 100;
    let color = chalk.green;
    if (percent > 75) color = chalk.red;
    else if (percent > 50) color = chalk.yellow;
    return color(`${percent.toFixed(1)}%`);
}

export function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function formatDuration(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

export function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function wrapText(text: string, maxWidth: number): readonly string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
        if ((currentLine + ' ' + word).length > maxWidth) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? `${currentLine} ${word}` : word;
        }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
}

export function centerText(text: string, width: number): string {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
}

export function formatBox(title: string, content: readonly string[], width: number = 60): readonly string[] {
    const lines: string[] = [];
    const innerWidth = width - 4;
    
    // Top border
    lines.push(chalk.gray('┌' + '─'.repeat(width - 2) + '┐'));
    
    // Title
    if (title) {
        const paddedTitle = centerText(title, innerWidth);
        lines.push(chalk.gray('│ ') + chalk.bold(paddedTitle) + chalk.gray(' │'));
        lines.push(chalk.gray('├' + '─'.repeat(width - 2) + '┤'));
    }
    
    // Content
    for (const line of content) {
        const truncated = line.length > innerWidth ? line.substring(0, innerWidth - 3) + '...' : line;
        const padded = truncated.padEnd(innerWidth);
        lines.push(chalk.gray('│ ') + padded + chalk.gray(' │'));
    }
    
    // Bottom border
    lines.push(chalk.gray('└' + '─'.repeat(width - 2) + '┘'));
    
    return lines;
}
