import { watch, FSWatcher } from 'fs';
import { EventEmitter } from 'events';

/**
 * FileWatcher - Watches configuration files for external changes
 * Provides debounced reload on file changes
 */
export class FileWatcher extends EventEmitter {
    private readonly filePath: string;
    private watcher: FSWatcher | null = null;
    private debounceTimer: NodeJS.Timeout | null = null;
    private readonly debounceDelay: number;
    private lastModified: number = 0;
    private isOwnChange: boolean = false;

    constructor(filePath: string, debounceDelay: number = 100) {
        super();
        this.filePath = filePath;
        this.debounceDelay = debounceDelay;
    }

    /**
     * Starts watching the file
     */
    public start(): void {
        if (this.watcher) {
            return;
        }

        try {
            this.watcher = watch(this.filePath, (eventType, filename) => {
                if (eventType === 'change') {
                    this.handleChange();
                }
            });

            this.watcher.on('error', (error) => {
                this.emit('error', error);
            });
        } catch (error) {
            this.emit('error', error);
        }
    }

    /**
     * Stops watching the file
     */
    public stop(): void {
        if (this.watcher) {
            this.watcher.close();
            this.watcher = null;
        }

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
    }

    /**
     * Marks next change as own change (to prevent reload loop)
     */
    public markOwnChange(): void {
        this.isOwnChange = true;
        this.updateLastModified();
    }

    private handleChange(): void {
        // Check if this was our own change
        if (this.isOwnChange) {
            this.isOwnChange = false;
            return;
        }

        // Debounce multiple rapid changes
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            
            // Check if file actually changed
            const fs = require('fs');
            try {
                const stats = fs.statSync(this.filePath);
                const modified = stats.mtimeMs;

                if (modified !== this.lastModified) {
                    this.lastModified = modified;
                    this.emit('change');
                }
            } catch (error) {
                this.emit('error', error);
            }
        }, this.debounceDelay);
    }

    private updateLastModified(): void {
        const fs = require('fs');
        try {
            const stats = fs.statSync(this.filePath);
            this.lastModified = stats.mtimeMs;
        } catch {
            // Ignore errors
        }
    }

    /**
     * Checks if watcher is active
     */
    public isActive(): boolean {
        return this.watcher !== null;
    }
}
